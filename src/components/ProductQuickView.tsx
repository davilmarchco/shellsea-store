import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { SIZES, formatBRL, type SizeOption } from "@/data/products";

const NO_STONE = "Nenhuma";
const NO_PENDANT = "Nenhum";

/** Simple quick-view dialog opened by tapping a product's name or price. */
export function ProductQuickView() {
  const { quickViewProduct, closeQuickView, addToCart, openCart } = useSiteUI();
  const [size, setSize] = useState<SizeOption>("M");
  useBodyScrollLock(quickViewProduct !== null);

  useEffect(() => {
    if (quickViewProduct) setSize("M");
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;
  const product = quickViewProduct;
  const isBiquini = product.type === "biquini";
  const installmentValue = product.price / product.installments;

  function handleAddToCart() {
    addToCart({
      product,
      size: isBiquini ? size : "Único",
      stone: NO_STONE,
      pendant: NO_PENDANT,
    });
    closeQuickView();
    openCart();
  }

  return (
    <AnimatePresence>
      {quickViewProduct ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeQuickView}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${product.model} ${product.color}`}
            className="relative grid w-full max-w-2xl grid-cols-1 overflow-hidden rounded-3xl bg-background shadow-2xl sm:grid-cols-2"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeQuickView}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-background text-foreground shadow-md transition-transform hover:scale-105"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="aspect-square bg-muted sm:aspect-auto">
              {product.frontImage ? (
                <img
                  src={product.frontImage}
                  alt={`${product.model} ${product.color}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center px-4 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Foto em breve
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
              <h3 className="font-heading text-lg font-bold tracking-wide text-foreground uppercase sm:text-xl">
                {product.model}
              </h3>
              <p className="mt-1 text-sm font-bold tracking-wide text-brandblue uppercase">
                {isBiquini ? `Cor: ${product.color}` : product.color}
              </p>
              <p className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
                {formatBRL(product.price)}
              </p>
              {product.installments > 1 ? (
                <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                  {product.installments} x de {formatBRL(installmentValue)} sem juros
                </p>
              ) : null}

              {isBiquini ? (
                <div className="mt-5 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">Tamanho:</span>
                    <div className="flex gap-1.5">
                      {SIZES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={size === option}
                          onClick={() => setSize(option)}
                          className={`h-8 w-9 rounded-sm border text-xs font-bold transition-colors ${
                            size === option
                              ? "border-petrol bg-petrol text-petrol-foreground"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleAddToCart}
                className="mt-6 w-full rounded-sm bg-petrol px-4 py-3 text-sm font-bold tracking-[0.1em] text-petrol-foreground uppercase transition-colors hover:bg-petrol/90"
              >
                Adicionar à sacola
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
