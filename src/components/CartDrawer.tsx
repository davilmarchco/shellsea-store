import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, MapPin, Minus, Pencil, Plus, ShieldCheck, ShoppingBag, Store, X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createCheckoutPreference } from "@/lib/checkout.server";
import { formatBRL } from "@/data/products";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  COUPON_CODE,
  COUPON_DISCOUNT,
  hasUsedFirstPurchaseCoupon,
  isCouponCodeValid,
  markFirstPurchaseCouponUsed,
} from "@/lib/coupon";

type CouponStatus = "idle" | "invalid" | "used" | "applied";
type Step = "cart" | "checkout";
type DeliveryMode = "" | "address" | "pickup";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "text-xs font-semibold tracking-wide text-muted-foreground uppercase";
const STORE_WHATSAPP = "5521993734339";

interface DeliveryZone {
  id: string;
  bairro: string;
  taxa: number;
  tempo: string | null;
}

interface CheckoutFormValues {
  name: string;
  email: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhoodText: string;
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
  neighborhoodText: "",
  city: "",
  state: "",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function matchZone(zones: DeliveryZone[], neighborhood: string): DeliveryZone | undefined {
  if (!neighborhood.trim()) return undefined;
  const target = normalizeText(neighborhood);
  return (
    zones.find((z) => normalizeText(z.bairro) === target) ??
    zones.find((z) => normalizeText(z.bairro).includes(target) || target.includes(normalizeText(z.bairro)))
  );
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

function isProfileAddressComplete(form: CheckoutFormValues): boolean {
  return Boolean(
    form.name &&
      form.phone &&
      form.zip &&
      form.street &&
      form.number &&
      form.neighborhoodText &&
      form.city &&
      form.state,
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart, cartLines, removeFromCart, setLineQty, clearCart } = useSiteUI();
  const { session, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("cart");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
  const [form, setForm] = useState<CheckoutFormValues>(EMPTY_FORM);
  const [editingAddress, setEditingAddress] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  useBodyScrollLock(cartOpen);

  // Fills in anything still blank from the saved profile — never overwrites
  // what the customer already typed herself.
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
      neighborhoodText: current.neighborhoodText || profile?.address_neighborhood || "",
      city: current.city || profile?.address_city || "",
      state: current.state || profile?.address_state || "",
    }));
  }, [profile, session]);

  // Skip the raw form entirely when she already has a complete saved address.
  useEffect(() => {
    if (step !== "checkout") return;
    setEditingAddress(!isProfileAddressComplete(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "checkout" || !supabase || zones.length > 0) return;
    supabase
      .from("delivery_zones")
      .select("id, bairro, taxa, tempo")
      .eq("ativo", true)
      .order("bairro", { ascending: true })
      .then(({ data }) => {
        if (data) setZones(data.map((z) => ({ ...z, taxa: Number(z.taxa) })));
      });
  }, [step, zones.length]);

  const matchedZone = useMemo(
    () => matchZone(zones, form.neighborhoodText),
    [zones, form.neighborhoodText],
  );

  // Once the address is confirmed, auto-pick a delivery card so it's never
  // left unset — the matched zone when we have one, pickup otherwise.
  useEffect(() => {
    if (editingAddress || deliveryMode) return;
    setDeliveryMode(matchedZone ? "address" : "pickup");
  }, [editingAddress, matchedZone, deliveryMode]);

  const isPickup = deliveryMode === "pickup";
  const shippingCost = isPickup ? 0 : deliveryMode === "address" && matchedZone ? matchedZone.taxa : 0;
  const pickupWhatsappUrl = `https://api.whatsapp.com/send?phone=${STORE_WHATSAPP}&text=${encodeURIComponent(
    "Olá! Gostaria de combinar a retirada do meu pedido na SheLL Sea",
  )}`;

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
  const grandTotal = total + shippingCost;

  function applyCoupon() {
    if (!isCouponCodeValid(coupon)) {
      setCouponStatus("invalid");
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

  async function handleCepBlur() {
    const digits = form.zip.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const result = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (result.erro) return;
      setForm((current) => ({
        ...current,
        street: result.logradouro || current.street,
        city: result.localidade || current.city,
        state: (result.uf || current.state).toUpperCase(),
        neighborhoodText: result.bairro || current.neighborhoodText,
      }));
    } catch {
      // CEP lookup is a convenience, not a requirement — ignore failures.
    }
  }

  async function handleSaveAddress() {
    if (!isProfileAddressComplete(form)) {
      setCheckoutError("Preencha nome, WhatsApp e endereço completos para continuar.");
      return;
    }
    setCheckoutError(null);
    setDeliveryMode("");

    if (session && supabase) {
      setSavingProfile(true);
      try {
        await supabase
          .from("customers")
          .update({
            full_name: form.name,
            phone: form.phone,
            address_zip: form.zip,
            address_street: form.street,
            address_number: form.number,
            address_complement: form.complement || null,
            address_neighborhood: form.neighborhoodText,
            address_city: form.city,
            address_state: form.state,
          })
          .eq("id", session.user.id);
        await refreshProfile();
      } finally {
        setSavingProfile(false);
      }
    }

    setEditingAddress(false);
  }

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!deliveryMode || (deliveryMode === "address" && !matchedZone)) {
      setCheckoutError("Escolha como quer receber o pedido para continuar.");
      return;
    }
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
            city: form.city,
            state: form.state,
          },
          shippingOption:
            isPickup || !matchedZone
              ? { type: "custom_pickup" as const }
              : { type: "neighborhood_delivery" as const, neighborhood: matchedZone.bairro },
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

  const addressLine = `${form.street}, ${form.number}${form.complement ? ` - ${form.complement}` : ""} - ${form.neighborhoodText}, ${form.city}`;

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
                    {couponStatus === "used" ? (
                      <p className="text-xs font-semibold text-destructive">
                        Este cupom já foi utilizado. Válido apenas na primeira compra.
                      </p>
                    ) : null}
                    {couponStatus === "applied" ? (
                      <p className="text-xs font-semibold text-pix">
                        Cupom {COUPON_CODE} aplicado! (-10%) · -{formatBRL(couponDiscount)}
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
                <div className="flex-1 space-y-4 px-5 py-4">
                  {!editingAddress ? (
                    <div className="rounded-full bg-muted px-4 py-2.5 text-center text-sm font-semibold text-foreground">
                      Pedido para {form.name.split(" ")[0]} · {formatPhoneDisplay(form.phone)}
                    </div>
                  ) : null}

                  {editingAddress ? (
                    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
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
                          <span className={labelClass}>WhatsApp (com DDD)</span>
                          <input
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(e) => updateForm("phone", e.target.value)}
                            className={inputClass}
                          />
                        </label>
                        <label className="space-y-1">
                          <span className={labelClass}>E-mail</span>
                          <input
                            type="email"
                            required
                            disabled={Boolean(session)}
                            value={form.email}
                            onChange={(e) => updateForm("email", e.target.value)}
                            className={inputClass}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <label className="col-span-1 space-y-1">
                          <span className={labelClass}>CEP</span>
                          <input
                            type="text"
                            required
                            value={form.zip}
                            onChange={(e) => updateForm("zip", e.target.value)}
                            onBlur={() => void handleCepBlur()}
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
                            list="checkout-bairro-options"
                            value={form.neighborhoodText}
                            onChange={(e) => updateForm("neighborhoodText", e.target.value)}
                            className={inputClass}
                          />
                          <datalist id="checkout-bairro-options">
                            {zones.map((zone) => (
                              <option key={zone.id} value={zone.bairro} />
                            ))}
                          </datalist>
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
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

                      {checkoutError ? (
                        <p className="text-xs font-semibold text-destructive">{checkoutError}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleSaveAddress()}
                        disabled={savingProfile}
                        className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        {savingProfile ? "Salvando..." : "Salvar e continuar"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <DeliveryOptionCard
                        selected={deliveryMode === "address"}
                        disabled={!matchedZone}
                        onSelect={() => matchedZone && setDeliveryMode("address")}
                        icon={<MapPin className="h-5 w-5 text-pix" />}
                        title="Entrega no endereço"
                      >
                        <p className="text-xs text-muted-foreground">{addressLine}</p>
                        {matchedZone ? (
                          <p className="mt-1 text-xs font-bold text-pix">
                            {formatBRL(matchedZone.taxa)}
                            {matchedZone.tempo ? ` · ${matchedZone.tempo}` : ""}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-semibold text-destructive">
                            Bairro fora da nossa área de entrega — escolha retirada ou edite o
                            endereço.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddress(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brandblue hover:underline"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                      </DeliveryOptionCard>

                      <DeliveryOptionCard
                        selected={deliveryMode === "pickup"}
                        onSelect={() => setDeliveryMode("pickup")}
                        icon={<Store className="h-5 w-5 text-coral" />}
                        title="Retirada com a lojista — Sem taxa de entrega"
                      >
                        <p className="text-xs text-muted-foreground">
                          Combine o ponto e horário de retirada diretamente com a loja
                        </p>
                        <a
                          href={pickupWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-1.5 text-xs font-bold text-whatsapp-foreground transition-transform hover:scale-105"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                          Combinar retirada pelo WhatsApp
                        </a>
                      </DeliveryOptionCard>
                    </div>
                  )}
                </div>

                {!editingAddress ? (
                  <div className="space-y-3 border-t border-border px-5 py-4">
                    <div className="flex items-start gap-2 rounded-2xl border border-pix/25 bg-pix/10 px-4 py-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pix" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Pagamento online</p>
                        <p className="text-xs text-muted-foreground">
                          Escolha entre Pix ou cartão (com parcelamento) na próxima tela, processado
                          com segurança pelo Mercado Pago.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatBRL(total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      <span className="text-foreground">
                        {isPickup ? "Retirada" : shippingCost > 0 ? formatBRL(shippingCost) : "Grátis"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-foreground">{formatBRL(grandTotal)}</span>
                    </div>

                    {checkoutError ? (
                      <p className="text-xs font-semibold text-destructive">{checkoutError}</p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Processando..." : `Ir para Pagamento (${formatBRL(grandTotal)})`}
                    </button>
                  </div>
                ) : null}
              </form>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function DeliveryOptionCard({
  selected,
  disabled,
  onSelect,
  icon,
  title,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  // A plain <button> can't legally contain the nested "Editar" button / WhatsApp
  // link rendered inside `children` (invalid HTML, breaks hydration) — so the
  // whole card is a keyboard-accessible div with role="button" instead.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-2xl border-2 p-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
        disabled && !selected ? "opacity-70" : "",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <div className="mt-1">{children}</div>
        </div>
        <span
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
            selected ? "border-primary bg-primary" : "border-border",
          )}
        />
      </div>
    </div>
  );
}
