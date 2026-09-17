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

/**
 * Mercado Pago's Preference API rejects any item with `unit_price <= 0`, so a
 * discount can never ride as its own negative line item — that was silently
 * failing every checkout with a coupon or a free accessory (i.e. almost every
 * real order). Instead, spread the discount proportionally across the real
 * items, keeping every unit_price positive. Works in integer cents so the
 * totals reconcile exactly instead of drifting from float rounding.
 */
function distributeDiscountAcrossItems(
  items: { id: string; name: string; price: number; quantity: number; image: string | null }[],
  discountTotal: number,
): { id: string; name: string; quantity: number; unit_price: number; image: string | null }[] {
  const toCents = (value: number) => Math.round(value * 100);
  const lineTotalCents = items.reduce((sum, item) => sum + toCents(item.price) * item.quantity, 0);
  const discountCents = Math.max(0, Math.min(toCents(discountTotal), lineTotalCents - items.length));

  let remainingDiscountCents = discountCents;
  return items.map((item, index) => {
    const itemTotalCents = toCents(item.price) * item.quantity;
    const isLast = index === items.length - 1;
    const shareCents = isLast
      ? remainingDiscountCents
      : Math.min(
          Math.round((itemTotalCents / lineTotalCents) * discountCents),
          itemTotalCents - item.quantity,
        );
    remainingDiscountCents -= shareCents;
    const discountedTotalCents = itemTotalCents - shareCents;
    const unitPriceCents = Math.max(1, Math.round(discountedTotalCents / item.quantity));
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: unitPriceCents / 100,
      image: item.image,
    };
  });
}

/** Guards against back_urls/notification_url ever pointing at a dev origin —
 * Mercado Pago's `auto_return: "approved"` requires a strictly valid,
 * publicly reachable `back_urls.success`. */
function assertProductionOrigin(origin: string): void {
  if (!origin.startsWith("https://") || origin.includes("localhost")) {
    console.error("[checkout] origin inválida para URLs do Mercado Pago:", origin);
    throw new Error("URL da loja mal configurada no servidor (APP_URL). Contate o suporte.");
  }
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
    assertProductionOrigin(origin);
    const discountTotal = freeAccessoryDiscount + couponDiscount;

    const preferenceItems = distributeDiscountAcrossItems(orderItems, discountTotal).map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "BRL",
      ...(item.image ? { picture_url: item.image } : {}),
    }));
    if (shippingCost > 0) {
      preferenceItems.push({
        id: "frete",
        title: `Frete — ${neighborhood}`,
        quantity: 1,
        unit_price: Number(shippingCost.toFixed(2)),
        currency_id: "BRL",
      });
    }

    const preferenceBody = {
      items: preferenceItems,
      payer: {
        name: data.customerName,
        email: data.customerEmail,
        phone: { number: data.customerPhone.replace(/\D/g, "") },
      },
      external_reference: order.id,
      notification_url: `${origin}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${origin}/pedido-confirmado?order_id=${order.id}`,
        pending: `${origin}/pedido-confirmado?order_id=${order.id}`,
        failure: `${origin}/?checkout=failure`,
      },
      auto_return: "approved" as const,
    };

    try {
      const preference = await new Preference(mercadoPagoConfig).create({ body: preferenceBody });

      const checkoutUrl = isMercadoPagoTestToken
        ? preference.sandbox_init_point
        : preference.init_point;
      if (!checkoutUrl) throw new Error("Mercado Pago não retornou um link de checkout.");

      return { orderId: order.id as string, checkoutUrl };
    } catch (mpError) {
      // Don't leave a dangling pending order if the preference couldn't be created.
      await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);

      const mpDetails =
        mpError && typeof mpError === "object"
          ? {
              status: (mpError as { status?: unknown }).status,
              error: (mpError as { error?: unknown }).error,
              message: (mpError as { message?: unknown }).message,
              causes: (mpError as { causes?: unknown }).causes,
            }
          : mpError;
      console.error(
        "[checkout] Mercado Pago rejeitou a criação da preferência.\nPayload enviado:",
        JSON.stringify(preferenceBody, null, 2),
        "\nErro retornado pelo Mercado Pago:",
        JSON.stringify(mpDetails, null, 2),
      );

      // Never surface the raw Mercado Pago/SDK error message to the customer —
      // log it above for debugging, but show a friendly, actionable message.
      throw new Error(
        "Tivemos uma instabilidade momentânea no gateway de pagamento. Tente novamente em instantes ou fale com a gente no WhatsApp para concluir seu pedido.",
      );
    }
  });
