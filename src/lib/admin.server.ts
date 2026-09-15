import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { OrderItemSummary, OrderShippingAddress } from "@/lib/orders.server";

const ORDER_STATUSES = ["pending", "paid", "cancelled", "shipped"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env["ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

/**
 * Verifies the caller's Supabase access token and confirms they're an admin —
 * either via `customers.role = 'admin'` or by being on the ADMIN_EMAILS
 * allowlist. Never trust a client-asserted "I'm an admin" flag; this is the
 * only thing every admin server function relies on for access control.
 */
async function requireAdmin(accessToken: string | undefined): Promise<{ id: string; email: string }> {
  if (!accessToken || !supabase) throw new Error("Não autenticado.");
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.email) throw new Error("Não autenticado.");

  if (isAllowlistedAdminEmail(data.user.email)) {
    return { id: data.user.id, email: data.user.email };
  }

  if (!supabaseAdmin) throw new Error("Acesso restrito.");
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (customer?.role !== "admin") throw new Error("Acesso restrito.");

  return { id: data.user.id, email: data.user.email };
}

const accessTokenInput = z.object({ accessToken: z.string() });

export interface AdminOrderRow {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemSummary[];
  shippingAddress: OrderShippingAddress;
  shippingCost: number;
  shippingMethod: string | null;
  totalAmount: number;
  paymentMethod: string | null;
  status: OrderStatus;
}

export interface AdminDashboardData {
  summary: {
    totalRevenue: number;
    paidOrders: number;
    pendingOrders: number;
    toShipOrders: number;
  };
  orders: AdminOrderRow[];
}

/** Checks admin access without returning any order data — used by the /admin
 * page to decide whether to show the dashboard or "Acesso restrito". */
export const checkIsAdmin = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof accessTokenInput>) => accessTokenInput.parse(input))
  .handler(async ({ data }): Promise<boolean> => {
    try {
      await requireAdmin(data.accessToken);
      return true;
    } catch {
      return false;
    }
  });

export const getAdminDashboardData = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof accessTokenInput>) => accessTokenInput.parse(input))
  .handler(async ({ data }): Promise<AdminDashboardData> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, created_at, customer_name, customer_email, customer_phone, items, shipping_address, shipping_cost, shipping_method, total_amount, payment_method, status",
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Não foi possível carregar os pedidos: ${error.message}`);

    const orders: AdminOrderRow[] = (rows ?? []).map((row) => ({
      id: row.id as string,
      createdAt: row.created_at as string,
      customerName: row.customer_name as string,
      customerEmail: row.customer_email as string,
      customerPhone: row.customer_phone as string,
      items: row.items as OrderItemSummary[],
      shippingAddress: row.shipping_address as OrderShippingAddress,
      shippingCost: Number(row.shipping_cost),
      shippingMethod: row.shipping_method as string | null,
      totalAmount: Number(row.total_amount),
      paymentMethod: row.payment_method as string | null,
      status: row.status as OrderStatus,
    }));

    const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "shipped");
    const summary = {
      totalRevenue: paidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      paidOrders: paidOrders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      toShipOrders: orders.filter((o) => o.status === "paid").length,
    };

    return { summary, orders };
  });

const updateStatusInput = accessTokenInput.extend({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof updateStatusInput>) => updateStatusInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);

    if (error) throw new Error(`Não foi possível atualizar o pedido: ${error.message}`);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export interface AdminCustomerRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  createdAt: string;
}

export const getAdminCustomers = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof accessTokenInput>) => accessTokenInput.parse(input))
  .handler(async ({ data }): Promise<AdminCustomerRow[]> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    const [customersResult, usersResult, ordersResult] = await Promise.all([
      supabaseAdmin
        .from("customers")
        .select("id, full_name, phone, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("orders").select("customer_id"),
    ]);

    if (customersResult.error) {
      throw new Error(`Não foi possível carregar as clientes: ${customersResult.error.message}`);
    }
    if (usersResult.error) {
      throw new Error(`Não foi possível carregar os e-mails: ${usersResult.error.message}`);
    }

    const emailById = new Map(usersResult.data.users.map((u) => [u.id, u.email ?? ""]));
    const orderCountById = new Map<string, number>();
    for (const row of ordersResult.data ?? []) {
      const id = row.customer_id as string | null;
      if (!id) continue;
      orderCountById.set(id, (orderCountById.get(id) ?? 0) + 1);
    }

    return (customersResult.data ?? []).map((c) => ({
      id: c.id as string,
      fullName: c.full_name as string,
      email: emailById.get(c.id as string) ?? "",
      phone: c.phone as string | null,
      ordersCount: orderCountById.get(c.id as string) ?? 0,
      createdAt: c.created_at as string,
    }));
  });

const createCustomerInput = accessTokenInput.extend({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const createManualCustomer = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof createCustomerInput>) => createCustomerInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    // A `customers` row is only ever created via the `on_auth_user_created`
    // trigger on `auth.users`, so "adding a client" here means provisioning a
    // real (if password-less, admin-confirmed) auth user for her.
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone ?? null },
    });
    if (error) throw new Error(`Não foi possível criar a cliente: ${error.message}`);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Pedido manual
// ---------------------------------------------------------------------------

const manualShippingOptionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("zone"), neighborhood: z.string().min(1) }),
  z.object({ type: z.literal("combinar") }),
  z.object({ type: z.literal("none") }),
]);

const createManualOrderInput = accessTokenInput.extend({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  items: z.array(
    z.object({
      name: z.string().min(1),
      size: z.string().optional(),
      quantity: z.number().int().min(1),
    }),
  ).min(1),
  shippingOption: manualShippingOptionSchema,
  totalAmount: z.number().min(0),
  status: z.enum(ORDER_STATUSES),
});

export const createManualOrder = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof createManualOrderInput>) => createManualOrderInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    let shippingCost = 0;
    let neighborhood = "";
    let shippingMethod: string | null = null;

    if (data.shippingOption.type === "zone") {
      const { data: zone } = await supabaseAdmin
        .from("delivery_zones")
        .select("bairro, taxa")
        .eq("bairro", data.shippingOption.neighborhood)
        .maybeSingle();
      if (zone) {
        shippingCost = Number(zone.taxa);
        neighborhood = zone.bairro as string;
      }
    } else if (data.shippingOption.type === "combinar") {
      shippingMethod = "A combinar via WhatsApp";
      neighborhood = "A combinar com o lojista";
    }

    const phoneDigits = data.customerPhone.replace(/\D/g, "");
    const { error } = await supabaseAdmin.from("orders").insert({
      customer_name: data.customerName,
      customer_email: `manual-${phoneDigits}@sem-email.shellsea.com.br`,
      customer_phone: data.customerPhone,
      shipping_address: {
        zip: "",
        street: "",
        number: "",
        city: "",
        state: "",
        neighborhood,
      },
      items: data.items.map((item) => ({
        id: "manual",
        name: item.name,
        price: 0,
        quantity: item.quantity,
        size: item.size ?? null,
        image: null,
      })),
      subtotal: data.totalAmount - shippingCost,
      shipping_cost: shippingCost,
      total_amount: data.totalAmount,
      status: data.status,
      shipping_method: shippingMethod,
    });

    if (error) throw new Error(`Não foi possível criar o pedido: ${error.message}`);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Entregas (delivery_zones)
// ---------------------------------------------------------------------------

export interface AdminDeliveryZone {
  id: string;
  bairro: string;
  taxa: number;
  tempo: string | null;
  ativo: boolean;
}

export const getAdminDeliveryZones = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof accessTokenInput>) => accessTokenInput.parse(input))
  .handler(async ({ data }): Promise<AdminDeliveryZone[]> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    const { data: rows, error } = await supabaseAdmin
      .from("delivery_zones")
      .select("id, bairro, taxa, tempo, ativo")
      .order("bairro", { ascending: true });

    if (error) throw new Error(`Não foi possível carregar os bairros: ${error.message}`);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      bairro: r.bairro as string,
      taxa: Number(r.taxa),
      tempo: r.tempo as string | null,
      ativo: r.ativo as boolean,
    }));
  });

const upsertZoneInput = accessTokenInput.extend({
  id: z.string().uuid().optional(),
  bairro: z.string().min(1),
  taxa: z.number().min(0),
  tempo: z.string().optional(),
  ativo: z.boolean(),
});

export const upsertDeliveryZone = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof upsertZoneInput>) => upsertZoneInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    const payload = {
      bairro: data.bairro,
      taxa: data.taxa,
      tempo: data.tempo ?? null,
      ativo: data.ativo,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("delivery_zones").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("delivery_zones").insert(payload);

    if (error) throw new Error(`Não foi possível salvar o bairro: ${error.message}`);
    return { ok: true };
  });

const deleteZoneInput = accessTokenInput.extend({ id: z.string().uuid() });

export const deleteDeliveryZone = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof deleteZoneInput>) => deleteZoneInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin(data.accessToken);
    if (!supabaseAdmin) throw new Error("Painel indisponível: Supabase não configurado.");

    const { error } = await supabaseAdmin.from("delivery_zones").delete().eq("id", data.id);
    if (error) throw new Error(`Não foi possível excluir o bairro: ${error.message}`);
    return { ok: true };
  });
