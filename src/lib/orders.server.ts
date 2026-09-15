import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const getOrderInputSchema = z.object({ orderId: z.string().uuid() });

export interface OrderItemSummary {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  image: string | null;
}

export interface OrderShippingAddress {
  zip: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderSummary {
  id: string;
  customerName: string;
  status: string;
  items: OrderItemSummary[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: OrderShippingAddress;
  createdAt: string;
}

/** Fetches an order by id for the confirmation page. Runs with the service
 * role key so it also works for guest checkouts (no customer_id to match
 * against RLS) — the order id itself (an unguessable UUID) is the access
 * control here, same as most e-commerce order-confirmation pages. */
export const getOrderById = createServerFn({ method: "GET" })
  .validator((input: z.infer<typeof getOrderInputSchema>) => getOrderInputSchema.parse(input))
  .handler(async ({ data }): Promise<OrderSummary | null> => {
    if (!supabaseAdmin) return null;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, customer_name, status, items, subtotal, shipping_cost, total_amount, shipping_address, created_at",
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return null;

    return {
      id: order.id as string,
      customerName: order.customer_name as string,
      status: order.status as string,
      items: order.items as OrderItemSummary[],
      subtotal: order.subtotal as number,
      shippingCost: order.shipping_cost as number,
      totalAmount: order.total_amount as number,
      shippingAddress: order.shipping_address as OrderShippingAddress,
      createdAt: order.created_at as string,
    };
  });
