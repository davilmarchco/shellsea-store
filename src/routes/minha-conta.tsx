import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useSiteUI } from "@/lib/site-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountDashboard } from "@/components/AccountDashboard";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha Conta | SheLL Sea" }],
  }),
  component: MinhaContaPage,
});

function MinhaContaPage() {
  const { session, loading } = useAuth();
  const { openAuth } = useSiteUI();
  const navigate = useNavigate();
  // Tracks whether this page ever saw an authenticated session, so we can tell
  // "arrived here without being logged in" (prompt to log in) apart from
  // "just clicked Sair" (already handled that — just go home quietly).
  const hadSession = useRef(false);

  useEffect(() => {
    if (session) hadSession.current = true;
  }, [session]);

  useEffect(() => {
    if (loading || session) return;
    if (!hadSession.current) openAuth();
    void navigate({ to: "/", replace: true });
  }, [loading, session, openAuth, navigate]);

  if (loading || !session) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-14 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return <AccountDashboard />;
}
