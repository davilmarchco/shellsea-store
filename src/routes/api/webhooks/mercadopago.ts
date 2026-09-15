import { createFileRoute } from "@tanstack/react-router";
import { Payment, WebhookSignatureValidator } from "mercadopago";
import { mercadoPagoConfig, mercadoPagoWebhookSecret } from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface MercadoPagoNotification {
  type?: string;
  topic?: string;
  data?: { id?: string | number };
}

/**
 * Mercado Pago calls this exact URL (configured as `notification_url` when the
 * preference is created) whenever a payment's status changes. It must respond
 * fast with 2xx or MP will retry — all we do here is verify the notification,
 * look the payment up, and flip our own order's status.
 */
export const Route = createFileRoute("/api/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let body: MercadoPagoNotification | null = null;
        try {
          body = (await request.json()) as MercadoPagoNotification;
        } catch {
          body = null;
        }

        const type = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
        const dataId = body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

        // Mercado Pago sends other topics too (merchant_order, etc.) — only
        // "payment" notifications are relevant here. Ack anything else so MP
        // stops retrying it.
        if (type !== "payment" || !dataId) {
          return Response.json({ received: true });
        }

        if (mercadoPagoWebhookSecret) {
          try {
            WebhookSignatureValidator.validate({
              xSignature: request.headers.get("x-signature"),
              xRequestId: request.headers.get("x-request-id"),
              dataId: String(dataId),
              secret: mercadoPagoWebhookSecret,
              toleranceSeconds: 300,
            });
          } catch (err) {
            console.error("Assinatura inválida no webhook do Mercado Pago:", err);
            return new Response("Invalid signature", { status: 401 });
          }
        } else {
          console.warn(
            "MERCADOPAGO_WEBHOOK_SECRET não configurado — pulando validação de assinatura do webhook.",
          );
        }

        if (!mercadoPagoConfig || !supabaseAdmin) {
          console.error("Webhook do Mercado Pago recebido, mas o servidor não está configurado.");
          return new Response("Server not configured", { status: 500 });
        }

        try {
          const payment = await new Payment(mercadoPagoConfig).get({ id: String(dataId) });

          if (payment.status === "approved" && payment.external_reference) {
            const { data: order } = await supabaseAdmin
              .from("orders")
              .update({
                status: "paid",
                payment_id: payment.id != null ? String(payment.id) : null,
                payment_method: payment.payment_method_id ?? null,
              })
              .eq("id", payment.external_reference)
              .select("customer_id")
              .maybeSingle();

            if (order?.customer_id) {
              await supabaseAdmin
                .from("customers")
                .update({ has_ordered: true })
                .eq("id", order.customer_id);
            }
          } else if (
            (payment.status === "cancelled" || payment.status === "rejected") &&
            payment.external_reference
          ) {
            await supabaseAdmin
              .from("orders")
              .update({ status: "cancelled" })
              .eq("id", payment.external_reference)
              .eq("status", "pending");
          }
        } catch (err) {
          console.error("Erro ao processar webhook do Mercado Pago:", err);
          return new Response("Error processing webhook", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});
