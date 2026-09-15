import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageX, Truck } from "lucide-react";
import { z } from "zod";
import { getOrderById } from "@/lib/orders.server";
import { formatBRL } from "@/data/products";

const searchSchema = z.object({ order_id: z.string().optional() });

export const Route = createFileRoute("/pedido-confirmado")({
  head: () => ({ meta: [{ title: "Pedido Confirmado | SheLL Sea" }] }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ orderId: search.order_id }),
  loader: async ({ deps }) => {
    if (!deps.orderId) return null;
    try {
      return await getOrderById({ data: { orderId: deps.orderId } });
    } catch {
      return null;
    }
  },
  component: PedidoConfirmadoPage,
});

function PedidoConfirmadoPage() {
  const order = Route.useLoaderData();

  if (!order) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <PackageX className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-heading text-xl font-bold text-foreground">Pedido não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Não encontramos esse pedido. Se você acabou de finalizar uma compra, confira seu e-mail
          ou entre em contato pelo WhatsApp.
        </p>
        <Link
          to="/"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const address = order.shippingAddress;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-5 sm:px-6">
          <Link to="/" className="text-lg font-extrabold tracking-[0.15em] text-foreground">
            SHELL SEA
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col items-center gap-3 text-center">
          {isPaid ? (
            <CheckCircle2 className="h-14 w-14 text-pix" />
          ) : (
            <Clock className="h-14 w-14 text-coral" />
          )}
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {isPaid ? "Pagamento aprovado!" : "Pedido recebido!"}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {isPaid
              ? "Seu pedido já está confirmado. Em breve entraremos em contato para combinar a entrega."
              : "Estamos confirmando seu pagamento — isso pode levar alguns segundos. Você pode atualizar esta página em instantes."}
          </p>
          <p className="text-xs text-muted-foreground">
            Pedido <span className="font-mono">{order.id}</span>
          </p>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-sm font-bold tracking-[0.1em] text-foreground uppercase">
            Itens do pedido
          </h2>
          <ul className="mt-4 space-y-4">
            {order.items.map((item, index) => (
              <li
                key={`${item.id}-${index}`}
                className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.size ? `Tam ${item.size} • ` : ""}Qtd {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-foreground">
                  {formatBRL(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatBRL(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Frete</span>
              <span>{order.shippingCost > 0 ? formatBRL(order.shippingCost) : "Grátis"}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-bold text-foreground">
              <span>Total</span>
              <span>{formatBRL(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-sm font-bold tracking-[0.1em] text-foreground uppercase">
            Endereço de entrega
          </h2>
          <p className="mt-3 text-sm text-foreground">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">
            {address.street}, {address.number}
            {address.complement ? ` - ${address.complement}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.neighborhood} — {address.city}/{address.state}
          </p>
          <p className="text-sm text-muted-foreground">CEP {address.zip}</p>
          {order.shippingCost > 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-pix">
              <Truck className="h-4 w-4" />
              Previsão de entrega: 5 dias úteis
            </p>
          ) : null}
        </section>

        <div className="flex justify-center">
          <Link
            to="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
          >
            Continuar comprando
          </Link>
        </div>
      </main>
    </div>
  );
}
