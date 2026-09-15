import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, Plus } from "lucide-react";
import { getAdminCustomers, type AdminCustomerRow } from "@/lib/admin.server";
import { NewCustomerModal } from "./NewCustomerModal";

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${withCountryCode}`;
}

export function ClientesTab({ accessToken }: { accessToken: string }) {
  const [customers, setCustomers] = useState<AdminCustomerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    getAdminCustomers({ data: { accessToken } })
      .then(setCustomers)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar clientes."));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground">Clientes</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Cliente
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      {!customers ? (
        <p className="text-sm text-muted-foreground">Carregando clientes...</p>
      ) : customers.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma cliente cadastrada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-semibold text-foreground">{customer.fullName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                  <td className="px-4 py-3">
                    {customer.phone ? (
                      <a
                        href={toWhatsAppUrl(customer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-pix hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {customer.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground">{customer.ordersCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewCustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accessToken={accessToken}
        onCreated={load}
      />
    </div>
  );
}
