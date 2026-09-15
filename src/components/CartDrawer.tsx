import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { useAuth } from "@/lib/auth";
import { createCheckoutPreference } from "@/lib/checkout.server";
import { formatBRL } from "@/data/products";
import {
  COUPON_CODE,
  COUPON_DISCOUNT,
  hasUsedFirstPurchaseCoupon,
  isCouponActive,
  markFirstPurchaseCouponUsed,
} from "@/lib/coupon";

type CouponStatus = "idle" | "invalid" | "inactive" | "used" | "applied";
type Step = "cart" | "checkout";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none";
const labelClass = "text-xs font-semibold tracking-wide text-muted-foreground uppercase";

interface CheckoutFormValues {
  name: string;
  email: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const EMPTY_FORM: CheckoutFormValues = {
  name: "",
  email: "",
  phone: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function CartDrawer() {
  const { cartOpen, closeCart, cartLines, removeFromCart, setLineQty, clearCart } = useSiteUI();
  const { session, profile } = useAuth();
  const [step, setStep] = useState<Step>("cart");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
  const [form, setForm] = useState<CheckoutFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useBodyScrollLock(cartOpen);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: current.name || profile?.full_name || "",
      email: current.email || session?.user.email || "",
      phone: current.phone || profile?.phone || "",
      zip: current.zip || profile?.address_zip || "",
      street: current.street || profile?.address_street || "",
      number: current.number || profile?.address_number || "",
      complement: current.complement || profile?.address_complement || "",
      neighborhood: current.neighborhood || profile?.address_neighborhood || "",
      city: current.city || profile?.address_city || "",
      state: current.state || profile?.address_state || "",
    }));
  }, [profile, session]);

  const biquiniQty = cartLines
    .filter((line) => line.product.type === "biquini")
    .reduce((sum, line) => sum + line.qty, 0);
  // The Sol Dourado pendant is never given away free — it's excluded from the freebie pool
  // entirely, so it never displaces a cheaper accessory from getting the discount.
  const eligibleAccessoryUnitPrices = cartLines
    .filter((line) => line.product.type !== "biquini" && line.product.id !== "pingente-sol-dourado")
    .flatMap((line) => Array<number>(line.qty).fill(line.product.price))
    .sort((a, b) => b - a);
  const freeAccessories = Math.min(biquiniQty, eligibleAccessoryUnitPrices.length);
  // The customer's free accessory is "à sua escolha" — free the priciest eligible units.
  const freeAccessoryDiscount = eligibleAccessoryUnitPrices
    .slice(0, freeAccessories)
    .reduce((sum, price) => sum + price, 0);

  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const afterFreebies = subtotal - freeAccessoryDiscount;
  const couponDiscount = couponApplied ? afterFreebies * COUPON_DISCOUNT : 0;
  const total = afterFreebies - couponDiscount;

  function applyCoupon() {
    const code = coupon.trim().toUpperCase().replace(/\s+/g, "");
    if (code !== COUPON_CODE) {
      setCouponStatus("invalid");
      setCouponApplied(false);
      return;
    }
    if (!isCouponActive()) {
      setCouponStatus("inactive");
      setCouponApplied(false);
      return;
    }
    if (hasUsedFirstPurchaseCoupon()) {
      setCouponStatus("used");
      setCouponApplied(false);
      return;
    }
    setCouponStatus("applied");
    setCouponApplied(true);
  }

  function handleClose() {
    closeCart();
    setStep("cart");
    setCheckoutError(null);
  }

  function updateForm<K extends keyof CheckoutFormValues>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setCheckoutError(null);

    try {
      const result = await createCheckoutPreference({
        data: {
          items: cartLines.map((line) => ({
            productId: line.product.id,
            qty: line.qty,
            size: line.product.type === "biquini" ? line.size : undefined,
          })),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: {
            zip: form.zip,
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
          couponCode: couponApplied ? coupon : undefined,
          accessToken: session?.access_token,
        },
      });

      if (couponApplied) markFirstPurchaseCouponUsed();
      clearCart();
      window.location.href = result.checkoutUrl;
    } catch (error) {
      setSubmitting(false);
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento. Tente novamente.",
      );
    }
  }

  return (
    <AnimatePresence>
      {cartOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Sacola de compras"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                {step === "checkout" ? (
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    aria-label="Voltar para a sacola"
                    className="grid h-8 w-8 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <p className="font-heading text-sm font-bold tracking-[0.15em] text-foreground uppercase">
                  {step === "cart" ? "Sua sacola" : "Dados de entrega"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar sacola"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground transition-transform hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {step === "cart" ? (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {cartLines.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {cartLines.map((line) => (
                        <li key={line.key} className="flex gap-3 border-b border-border pb-4">
                          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                            {line.product.frontImage ? (
                              <img
                                src={line.product.frontImage}
                                alt={line.product.model}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-foreground">
                              {line.product.model}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {line.product.type === "biquini"
                                ? `Cor: ${line.product.color} • Tam ${line.size}`
                                : line.product.color}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label="Diminuir quantidade"
                                  onClick={() => setLineQty(line.key, line.qty - 1)}
                                  className="grid h-6 w-6 place-items-center rounded-sm border border-border text-foreground hover:bg-muted"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-semibold">
                                  {line.qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label="Aumentar quantidade"
                                  onClick={() => setLineQty(line.key, line.qty + 1)}
                                  className="grid h-6 w-6 place-items-center rounded-sm border border-border text-foreground hover:bg-muted"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-sm font-bold text-foreground">
                                {formatBRL(line.product.price * line.qty)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Remover item"
                            onClick={() => removeFromCart(line.key)}
                            className="self-start text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {cartLines.length > 0 ? (
                  <div className="space-y-3 border-t border-border px-5 py-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cupom de desconto"
                        value={coupon}
                        onChange={(event) => {
                          setCoupon(event.target.value);
                          setCouponApplied(false);
                          setCouponStatus("idle");
                        }}
                        className="w-full min-w-0 rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="shrink-0 rounded-sm border border-border px-3 py-2 text-xs font-bold text-foreground uppercase hover:bg-muted"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponStatus === "invalid" ? (
                      <p className="text-xs font-semibold text-destructive">Cupom inválido.</p>
                    ) : null}
                    {couponStatus === "inactive" ? (
                      <p className="text-xs font-semibold text-destructive">
                        Cupom ainda não ativado. Cadastre-se no pop-up de boas-vindas para resgatar
                        seu desconto.
                      </p>
                    ) : null}
                    {couponStatus === "used" ? (
                      <p className="text-xs font-semibold text-destructive">
                        Este cupom já foi utilizado. Válido apenas na primeira compra.
                      </p>
                    ) : null}
                    {couponStatus === "applied" ? (
                      <p className="text-xs font-semibold text-pix">
                        Cupom ativo: 10% off na primeira compra ({formatBRL(couponDiscount)})
                      </p>
                    ) : null}

                    {freeAccessories > 0 ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-pix">
                          Brinde: Acessório Cortesia ({freeAccessories})
                        </span>
                        <span className="font-semibold text-pix">
                          -{formatBRL(freeAccessoryDiscount)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold text-foreground">{formatBRL(total)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("checkout")}
                      className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
                    >
                      Finalizar compra
                    </button>
                    <p className="text-center text-[0.65rem] text-muted-foreground">
                      Compra 100% segura, direto pelo nosso site.
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <form onSubmit={handlePay} className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex-1 space-y-5 px-5 py-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold tracking-[0.15em] text-foreground uppercase">
                      Seus dados
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="space-y-1 sm:col-span-2">
                        <span className={labelClass}>Nome completo</span>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => updateForm("name", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className={labelClass}>E-mail</span>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => updateForm("email", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className={labelClass}>Celular</span>
                        <input
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => updateForm("phone", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold tracking-[0.15em] text-foreground uppercase">
                      Endereço de entrega
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="col-span-1 space-y-1">
                        <span className={labelClass}>CEP</span>
                        <input
                          type="text"
                          required
                          value={form.zip}
                          onChange={(e) => updateForm("zip", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="col-span-2 space-y-1">
                        <span className={labelClass}>Rua</span>
                        <input
                          type="text"
                          required
                          value={form.street}
                          onChange={(e) => updateForm("street", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="col-span-1 space-y-1">
                        <span className={labelClass}>Número</span>
                        <input
                          type="text"
                          required
                          value={form.number}
                          onChange={(e) => updateForm("number", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="col-span-2 space-y-1">
                        <span className={labelClass}>Complemento</span>
                        <input
                          type="text"
                          value={form.complement}
                          onChange={(e) => updateForm("complement", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="col-span-3 space-y-1">
                        <span className={labelClass}>Bairro</span>
                        <input
                          type="text"
                          required
                          value={form.neighborhood}
                          onChange={(e) => updateForm("neighborhood", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="col-span-2 space-y-1">
                        <span className={labelClass}>Cidade</span>
                        <input
                          type="text"
                          required
                          value={form.city}
                          onChange={(e) => updateForm("city", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="col-span-1 space-y-1">
                        <span className={labelClass}>UF</span>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={form.state}
                          onChange={(e) => updateForm("state", e.target.value.toUpperCase())}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-foreground">{formatBRL(total)}</span>
                  </div>

                  {checkoutError ? (
                    <p className="text-xs font-semibold text-destructive">{checkoutError}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Processando..." : "Pagar com Mercado Pago"}
                  </button>
                  <p className="text-center text-[0.65rem] text-muted-foreground">
                    Pix ou cartão, pelo checkout seguro do Mercado Pago.
                  </p>
                </div>
              </form>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
