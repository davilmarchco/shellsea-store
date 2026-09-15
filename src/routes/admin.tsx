import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin.server";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminDashboard } from "@/components/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel Admin | SheLL Sea" }] }),
  component: AdminPage,
});

type AccessState = "checking" | "allowed" | "denied";

function AdminPage() {
  const { session, loading } = useAuth();
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setAccess("denied");
      return;
    }
    let cancelled = false;
    setAccess("checking");
    checkIsAdmin({ data: { accessToken: session.access_token } })
      .then((isAdmin) => {
        if (!cancelled) setAccess(isAdmin ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setAccess("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [loading, session]);

  if (loading || access === "checking") {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-heading text-xl font-bold text-foreground">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Esta área é exclusiva para administradoras da SheLL Sea. Se você acredita que deveria ter
          acesso, entre em contato com a equipe.
        </p>
        <a
          href="/"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
        >
          Voltar para a loja
        </a>
      </div>
    );
  }

  return <AdminDashboard />;
}
