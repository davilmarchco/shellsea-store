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
        "id, created_at, customer_name, customer_email, customer_phone, items, shipping_address, total_amount, payment_method, status",
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
