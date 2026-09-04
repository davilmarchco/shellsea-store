import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

/** Elegant login/signup modal wired to Supabase Auth. */
export function AuthModal() {
  const { authOpen, closeAuth } = useSiteUI();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  useBodyScrollLock(authOpen);

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setError(null);
    setSuccess(false);
    setNeedsEmailConfirmation(false);
  }

  function handleClose() {
    closeAuth();
    reset();
    setMode("signin");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp({ name, email, password, phone });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setNeedsEmailConfirmation(true);
      setSuccess(true);
      return;
    }

    setSuccess(true);
    window.setTimeout(handleClose, 1200);
  }

  return (
    <AnimatePresence>
      {authOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={mode === "signin" ? "Entrar na sua conta" : "Criar sua conta"}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-background p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground transition-transform hover:scale-105"
            >
              <X className="h-4 w-4" />
            </button>

            {success ? (
              <div className="space-y-2 py-8 text-center">
                <p className="font-heading text-xl font-bold text-coral">
                  {needsEmailConfirmation
                    ? "Quase lá!"
                    : mode === "signin"
                      ? "Bem-vinda de volta!"
                      : "Cadastro recebido!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {needsEmailConfirmation
                    ? "Confirme seu e-mail para ativar sua conta e fazer login."
                    : "Você já pode fechar esta janela."}
                </p>
                {needsEmailConfirmation ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
                  >
                    Fechar
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="mx-auto mb-6 flex w-full max-w-[16rem] rounded-full bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={cn(
                      "flex-1 rounded-full py-2 text-xs font-bold tracking-wide uppercase transition-colors",
                      mode === "signin"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={cn(
                      "flex-1 rounded-full py-2 text-xs font-bold tracking-wide uppercase transition-colors",
                      mode === "signup"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Cadastrar
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === "signup" ? (
                    <>
                      <input
                        type="text"
                        required
                        placeholder="Nome"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Celular (WhatsApp)"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                      />
                    </>
                  ) : null}
                  <input
                    type="email"
                    required
                    placeholder="E-mail"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                  />

                  {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {submitting ? "Enviando..." : mode === "signin" ? "Entrar" : "Criar conta"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
