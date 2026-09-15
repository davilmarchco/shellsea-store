import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, Plus, Search } from "lucide-react";
import { formatBRL } from "@/data/products";
import { cn } from "@/lib/utils";
import type { AdminDashboardData, AdminOrderRow, OrderStatus } from "@/lib/admin.server";
import { NewOrderModal } from "./NewOrderModal";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: "bg-coral/15 text-coral",
  paid: "bg-pix/15 text-pix",
  shipped: "bg-brandblue/15 text-brandblue",
  cancelled: "bg-destructive/15 text-destructive",
};

const STATUS_FILTERS: readonly ("all" | OrderStatus)[] = ["all", "pending", "paid", "shipped", "cancelled"];

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${withCountryCode}`;
}

function formatAddress(address: AdminOrderRow["shippingAddress"]): string {
  const line1 = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}`;
  const line2 = `${address.neighborhood} — ${address.city}/${address.state}`;
  return `${line1}\n${line2}\nCEP ${address.zip}`;
}

export function PedidosTab({
  data,
  loadError,
  accessToken,
  updatingId,
  onStatusChange,
  onRefresh,
}: {
  data: AdminDashboardData | null;
  loadError: string | null;
  accessToken: string;
  updatingId: string | null;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onRefresh: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!query) return true;
      return order.customerName.toLowerCase().includes(query) || order.id.toLowerCase().includes(query);
    });
  }, [data, statusFilter, search]);

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {loadError}
        </p>
      ) : null}

      {!data ? (
        <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Faturamento Total" value={formatBRL(data.summary.totalRevenue)} />
            <SummaryCard label="Pedidos Pagos" value={String(data.summary.paidOrders)} />
            <SummaryCard label="Pedidos Pendentes" value={String(data.summary.pendingOrders)} />
            <SummaryCard label="Pedidos a Enviar" value={String(data.summary.toShipOrders)} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {status === "all" ? "Todos" : STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-border bg-card py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setNewOrderOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo Pedido Manual
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">
              Nenhum pedido encontrado para esse filtro.
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredOrders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                          STATUS_BADGE_CLASS[order.status],
                        )}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground disabled:opacity-50"
                      >
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-6 lg:grid-cols-3">
                    <div>
                      <h3 className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
                        Comprador
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      <a
                        href={toWhatsAppUrl(order.customerPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-1.5 text-xs font-bold text-whatsapp-foreground transition-transform hover:scale-105"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Conversar no WhatsApp
                      </a>
                      <p className="mt-4 text-sm font-bold text-foreground">{formatBRL(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.paymentMethod ?? "Pagamento pendente"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
                        Itens
                      </h3>
                      <ul className="mt-1 space-y-2">
                        {order.items.map((item, index) => (
                          <li key={`${item.id}-${index}`} className="flex items-center gap-2">
                            <div className="h-10 w-9 shrink-0 overflow-hidden rounded-sm bg-muted">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                              <p className="text-[0.65rem] text-muted-foreground">
                                {item.size ? `Tam ${item.size} • ` : ""}Qtd {item.quantity}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
                        Endereço de entrega
                      </h3>
                      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                        {formatAddress(order.shippingAddress)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <NewOrderModal
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        accessToken={accessToken}
        onCreated={onRefresh}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">{value}</p>
    </div>
  );
}
