import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alias for /minha-conta so either URL reaches the same Área do Cliente. */
export const Route = createFileRoute("/perfil")({
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta" });
  },
});
