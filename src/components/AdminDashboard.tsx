import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellOff, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAdminDashboardData, updateOrderStatus, type AdminDashboardData, type OrderStatus } from "@/lib/admin.server";
import { useOrderSound } from "@/lib/use-order-sound";
import { cn } from "@/lib/utils";
import { PedidosTab } from "./admin/PedidosTab";
import { ClientesTab } from "./admin/ClientesTab";
import { EntregasTab } from "./admin/EntregasTab";

type Tab = "pedidos" | "clientes" | "entregas";

const TABS: { id: Tab; label: string }[] = [
  { id: "pedidos", label: "Pedidos" },
  { id: "clientes", label: "Clientes" },
  { id: "entregas", label: "Entregas" },
];

const POLL_INTERVAL_MS = 20_000;

export function AdminDashboard() {
  const { session, signOut } = useAuth();
  const accessToken = session?.access_token ?? "";
  const [tab, setTab] = useState<Tab>("pedidos");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const sound = useOrderSound();
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await getAdminDashboardData({ data: { accessToken } });
      setData(result);
      setLoadError(null);

      const alertableIds = result.orders
        .filter((o) => o.status === "pending" || o.status === "paid")
        .map((o) => o.id);
      if (firstLoad.current) {
        // Prime the baseline silently on first load — only ring for orders
        // that show up in a *later* poll.
        sound.notifyIfNewOrders(alertableIds);
        firstLoad.current = false;
      } else {
        sound.notifyIfNewOrders(alertableIds);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!accessToken) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus({ data: { accessToken, orderId, status } });
      setData((current) =>
        current
          ? { ...current, orders: current.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }
          : current,
      );
    } catch {
      // Silently ignore — the select just reverts on the next poll.
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link to="/" className="text-lg font-extrabold tracking-[0.15em] text-foreground">
            SHELL SEA <span className="text-muted-foreground">· admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={sound.toggle}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                sound.enabled
                  ? "border-pix/30 bg-pix/10 text-pix"
                  : "border-border bg-muted text-muted-foreground",
              )}
              title="Clique para testar o som"
            >
              {sound.enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              Alerta Sonoro: {sound.enabled ? "Ativado" : "Desativado"}
              <span className="hidden sm:inline">(clique para testar)</span>
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <nav className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "pedidos" ? (
          <PedidosTab
            data={data}
            loadError={loadError}
            accessToken={accessToken}
            updatingId={updatingId}
            onStatusChange={handleStatusChange}
            onRefresh={load}
          />
        ) : null}
        {tab === "clientes" ? <ClientesTab accessToken={accessToken} /> : null}
        {tab === "entregas" ? <EntregasTab accessToken={accessToken} /> : null}
      </main>
    </div>
  );
}
