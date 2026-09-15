import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createManualOrder,
  getAdminDeliveryZones,
  type AdminDeliveryZone,
  type OrderStatus,
} from "@/lib/admin.server";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none";
const labelClass = "text-xs font-semibold tracking-wide text-muted-foreground uppercase";

interface ItemRow {
  name: string;
  size: string;
  quantity: string;
}

const EMPTY_ITEM: ItemRow = { name: "", size: "", quantity: "1" };

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "shipped", label: "Enviado" },
  { value: "cancelled", label: "Cancelado" },
];

export function NewOrderModal({
  open,
  onOpenChange,
  accessToken,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  onCreated: () => void;
}) {
  const [zones, setZones] = useState<AdminDeliveryZone[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);
  const [shippingChoice, setShippingChoice] = useState("none");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState<OrderStatus>("paid");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    getAdminDeliveryZones({ data: { accessToken } })
      .then(setZones)
      .catch(() => setZones([]));
  }, [open, accessToken]);

  function reset() {
    setCustomerName("");
    setCustomerPhone("");
    setItems([{ ...EMPTY_ITEM }]);
    setShippingChoice("none");
    setTotalAmount("");
    setStatus("paid");
    setError(null);
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const shippingOption =
        shippingChoice === "none"
          ? ({ type: "none" as const })
          : shippingChoice === "combinar"
            ? ({ type: "combinar" as const })
            : ({ type: "zone" as const, neighborhood: shippingChoice });

      await createManualOrder({
        data: {
          accessToken,
          customerName,
          customerPhone,
          items: items
            .filter((item) => item.name.trim())
            .map((item) => ({
              name: item.name,
              size: item.size || undefined,
              quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
            })),
          shippingOption,
          totalAmount: Number(totalAmount) || 0,
          status,
        },
      });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo pedido manual</DialogTitle>
          <DialogDescription>
            Para vendas combinadas fora do site (WhatsApp, Instagram, presencial).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 space-y-1">
              <span className={labelClass}>Nome da cliente</span>
              <input
                required
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="col-span-2 space-y-1">
              <span className={labelClass}>Telefone</span>
              <input
                required
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Itens</span>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_4rem_4rem] gap-2">
                <input
                  type="text"
                  placeholder="Produto"
                  required
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Tam"
                  value={item.size}
                  onChange={(e) => updateItem(index, { size: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}
              className="text-xs font-bold text-brandblue hover:underline"
            >
              + Adicionar item
            </button>
          </div>

          <label className="space-y-1">
            <span className={labelClass}>Bairro / frete</span>
            <select
              value={shippingChoice}
              onChange={(e) => setShippingChoice(e.target.value)}
              className={inputClass}
            >
              <option value="none">Sem frete / retirada</option>
              <option value="combinar">A combinar com o lojista</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.bairro}>
                  {zone.bairro}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className={labelClass}>Valor total (R$)</span>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Criar pedido"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
