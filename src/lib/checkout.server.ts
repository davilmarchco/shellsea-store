import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { Preference } from "mercadopago";
import { z } from "zod";
import { PRODUCTS } from "@/data/products";
import { COUPON_DISCOUNT, isCouponCodeValid } from "@/lib/coupon";
import { isMercadoPagoTestToken, mercadoPagoConfig } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(50),
  size: z.string().optional(),
});

const shippingAddressSchema = z.object({
  zip: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1).max(2),
});

/** Which neighborhood/rate was picked never comes from the client as a number —
 * only the chosen zone's name (or the "combine over WhatsApp" flag) travels
 * over the wire; the real rate is always looked up server-side from
 * `delivery_zones`. Accepts both the current and the previous (pre-rename)
 * literal names so an old cached client bundle can't hard-fail checkout. */
const shippingOptionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("neighborhood_delivery"), neighborhood: z.string().min(1) }),
  z.object({ type: z.literal("custom_pickup") }),
  z.object({ type: z.literal("zone"), neighborhood: z.string().min(1) }),
  z.object({ type: z.literal("combinar") }),
]);

const checkoutInputSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  shippingAddress: shippingAddressSchema,
  shippingOption: shippingOptionSchema,
  couponCode: z.string().optional(),
  /** Supabase access token of the logged-in customer, if any — verified server-side. */
  accessToken: z.string().optional(),
});

/**
 * Looks up the caller's verified Supabase user id from their access token.
 * Never trust a client-asserted customer id: this is the only source of truth
 * for "who is actually making this purchase" that price/coupon logic relies on.
 */
async function getVerifiedCustomerId(accessToken: string | undefined): Promise<string | null> {
  if (!accessToken || !supabase) return null;
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user.id;
}

/** Same "1 free accessory per biquíni" rule as the cart drawer, recomputed
 * server-side from verified catalog prices — never trust client-sent totals. */
function computeFreeAccessoryDiscount(
  lines: { product: (typeof PRODUCTS)[number]; qty: number }[],
): number {
  const biquiniQty = lines
    .filter((l) => l.product.type === "biquini")
    .reduce((sum, l) => sum + l.qty, 0);
  const eligibleUnitPrices = lines
    .filter((l) => l.product.type !== "biquini" && l.product.id !== "pingente-sol-dourado")
    .flatMap((l) => Array<number>(l.qty).fill(l.product.price))
    .sort((a, b) => b - a);
  const freeCount = Math.min(biquiniQty, eligibleUnitPrices.length);
  return eligibleUnitPrices.slice(0, freeCount).reduce((sum, price) => sum + price, 0);
}

export const createCheckoutPreference = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const result = checkoutInputSchema.safeParse(input);
    if (!result.success) {
      // Never leak the raw ZodError JSON to the customer — a stale field or a
      // half-filled form should read as a normal, friendly message.
      throw new Error(
        "Não foi possível validar os dados do pedido. Atualize a página, revise o formulário e tente novamente.",
      );
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    if (!supabaseAdmin) {
      throw new Error(
        "Pagamento indisponível: SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
      );
    }
    if (!mercadoPagoConfig) {
      throw new Error(
        "Pagamento indisponível: MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.",
      );
    }

    const lines = data.items.map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Produto inválido: ${item.productId}`);
      return { product, qty: item.qty, size: item.size };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const freeAccessoryDiscount = computeFreeAccessoryDiscount(lines);

    const verifiedCustomerId = await getVerifiedCustomerId(data.accessToken);
    // A valid coupon applies immediately for anyone — guest or logged in, no
    // welcome-popup or first-purchase gate. Only the code itself is checked.
    const couponDiscount =
      data.couponCode && isCouponCodeValid(data.couponCode)
        ? (subtotal - freeAccessoryDiscount) * COUPON_DISCOUNT
        : 0;

    let shippingCost = 0;
    let shippingMethod: string | null = null;
    let neighborhood: string;
    if (data.shippingOption.type === "custom_pickup" || data.shippingOption.type === "combinar") {
      shippingMethod = "A combinar via WhatsApp";
      neighborhood = "A combinar com o lojista";
    } else {
      const { data: zone } = await supabaseAdmin
        .from("delivery_zones")
        .select("bairro, taxa, ativo")
        .eq("bairro", data.shippingOption.neighborhood)
        .maybeSingle();
      if (!zone || !zone.ativo) {
        throw new Error("Bairro de entrega inválido ou indisponível no momento.");
      }
      shippingCost = Number(zone.taxa);
      neighborhood = zone.bairro as string;
    }

    const totalAmount = subtotal - freeAccessoryDiscount - couponDiscount + shippingCost;
    if (totalAmount <= 0) throw new Error("Total do pedido inválido.");

    const orderItems = lines.map((l) => ({
      id: l.product.id,
      name: `${l.product.model} ${l.product.color}`,
      price: l.product.price,
      quantity: l.qty,
      size: l.size ?? null,
      image: l.product.frontImage ?? null,
    }));

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: verifiedCustomerId,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        shipping_address: { ...data.shippingAddress, neighborhood },
        items: orderItems,
        subtotal,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        status: "pending",
        shipping_method: shippingMethod,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(`Não foi possível criar o pedido: ${orderError?.message ?? "erro desconhecido"}`);
    }

    // Prefer the configured production URL so back/notification URLs stay stable
    // behind proxies/CDNs; fall back to the incoming request's own origin (dev).
    const origin = process.env["APP_URL"] ?? getRequestUrl().origin;
    const discountTotal = freeAccessoryDiscount + couponDiscount;

    const preferenceItems = orderItems.map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "BRL",
      ...(item.image ? { picture_url: item.image } : {}),
    }));
    if (discountTotal > 0) {
      preferenceItems.push({
        id: "desconto",
        title: "Desconto (brinde / cupom)",
        quantity: 1,
        unit_price: -discountTotal,
        currency_id: "BRL",
      });
    }
    if (shippingCost > 0) {
      preferenceItems.push({
        id: "frete",
        title: `Frete — ${neighborhood}`,
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "BRL",
      });
    }

    try {
      const preference = await new Preference(mercadoPagoConfig).create({
        body: {
          items: preferenceItems,
          payer: {
            name: data.customerName,
            email: data.customerEmail,
            phone: { number: data.customerPhone },
          },
          external_reference: order.id,
          notification_url: `${origin}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${origin}/pedido-confirmado?order_id=${order.id}`,
            pending: `${origin}/pedido-confirmado?order_id=${order.id}`,
            failure: `${origin}/?checkout=failure`,
          },
          auto_return: "approved",
        },
      });

      const checkoutUrl = isMercadoPagoTestToken
        ? preference.sandbox_init_point
        : preference.init_point;
      if (!checkoutUrl) throw new Error("Mercado Pago não retornou um link de checkout.");

      return { orderId: order.id as string, checkoutUrl };
    } catch (mpError) {
      // Don't leave a dangling pending order if the preference couldn't be created.
      await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      throw mpError instanceof Error
        ? mpError
        : new Error("Erro ao criar preferência de pagamento no Mercado Pago.");
    }
  });
