import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { formatBRL } from "@/data/products";
import {
  COUPON_CODE,
  COUPON_DISCOUNT,
  hasUsedFirstPurchaseCoupon,
  isCouponActive,
  markFirstPurchaseCouponUsed,
} from "@/lib/coupon";

type CouponStatus = "idle" | "invalid" | "inactive" | "used" | "applied";

export function CartDrawer() {
  const { cartOpen, closeCart, cartLines, removeFromCart, setLineQty, clearCart } = useSiteUI();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
  const [orderPlaced, setOrderPlaced] = useState(false);
  useBodyScrollLock(cartOpen);

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
    if (orderPlaced) {
      setOrderPlaced(false);
      setCoupon("");
      setCouponApplied(false);
      setCouponStatus("idle");
    }
  }

  function handleCheckout() {
    if (couponApplied) markFirstPurchaseCouponUsed();
    setOrderPlaced(true);
    clearCart();
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
              <p className="font-heading text-sm font-bold tracking-[0.15em] text-foreground uppercase">
                Sua sacola
              </p>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar sacola"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground transition-transform hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {orderPlaced ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <CheckCircle2 className="h-14 w-14 text-pix" />
                <p className="font-heading text-lg font-bold text-foreground">
                  Pedido realizado com sucesso!
                </p>
                <p className="text-sm text-muted-foreground">
                  Sua compra foi feita 100% pelo nosso site. Em breve entraremos em contato para
                  combinar a entrega.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
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
                      onClick={handleCheckout}
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
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
