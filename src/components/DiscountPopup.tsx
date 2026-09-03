import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import aboutPhoto from "@/assets/about-photo.jpg";
import { supabase } from "@/lib/supabase";
import { EASE_OUT } from "@/lib/motion";
import { COUPON_CODE, DISCOUNT_POPUP_STORAGE_KEY as STORAGE_KEY } from "@/lib/coupon";

const SHOW_DELAY_MS = 2500;

const inputClass =
  "w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none";

/**
 * First-purchase 10% off signup modal, in two steps: contact info, then a
 * password to finish creating the account. Shown once per browser: dismissing
 * or completing the form sets a localStorage flag so it never reopens.
 */
export function DiscountPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
    setOpen(false);
  }

  function handleContinue(event: FormEvent) {
    event.preventDefault();
    setStep(2);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Cadastro indisponível no momento. Tente novamente mais tarde.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, "subscribed");
    setSuccess(true);
    window.setTimeout(() => setOpen(false), 1800);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Cadastre-se e ganhe 10% de desconto"
            className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl bg-background shadow-2xl md:grid-cols-2"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-background text-foreground shadow-md transition-transform hover:scale-105"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="hidden md:block">
              <img
                src={aboutPhoto}
                alt="Amigas curtindo o mar com biquínis SheLL Sea"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center overflow-hidden px-6 py-10 text-center sm:px-10">
              {success ? (
                <div className="space-y-2 py-8">
                  <p className="font-heading text-2xl font-bold text-coral">Cadastro recebido!</p>
                  <p className="text-sm text-muted-foreground">
                    Seu cupom <strong className="text-foreground">{COUPON_CODE}</strong> já está
                    ativo. Use-o na sua primeira compra para garantir 10% de desconto.
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-heading text-4xl font-extrabold tracking-wide text-coral">
                    10% OFF
                  </p>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
                    Resgate seu cupom para garantir 10% de desconto na primeira compra. Cadastre-se
                    para ativar o cupom <strong className="text-foreground">{COUPON_CODE}</strong>.
                  </p>

                  <div className="mx-auto mt-5 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-6 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-primary/40"}`}
                    />
                    <span
                      className={`h-1.5 w-6 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-primary/40"}`}
                    />
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {step === 1 ? (
                      <motion.form
                        key="step1"
                        onSubmit={handleContinue}
                        className="mt-6 space-y-3 text-left"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                      >
                        <input
                          type="text"
                          required
                          placeholder="Nome"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="email"
                          required
                          placeholder="E-mail"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Celular (WhatsApp)"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className={inputClass}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
                        >
                          Continuar
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="step2"
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-3 text-left"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                      >
                        <p className="text-xs text-muted-foreground">
                          Falta pouco,{" "}
                          <strong className="text-foreground">{name.split(" ")[0]}</strong>! Crie
                          uma senha para concluir seu cadastro.
                        </p>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="Crie sua senha"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className={inputClass}
                        />

                        {error ? (
                          <p className="text-xs font-semibold text-destructive">{error}</p>
                        ) : null}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-60"
                        >
                          {submitting ? "Enviando..." : "Quero meu desconto"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="w-full text-center text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                          ← Voltar
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
