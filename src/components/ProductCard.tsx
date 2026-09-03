import { useEffect, useRef, useState, type TouchEvent } from "react";
import { cn } from "@/lib/utils";
import { SIZES, formatBRL, type Product, type SizeOption } from "@/data/products";
import { useSiteUI } from "@/lib/site-ui";

const NO_STONE = "Nenhuma";
const NO_PENDANT = "Nenhum";

export interface ProductCardProps {
  product: Product;
}

/** True on devices that support real mouse hover (desktop), false on touch. */
function useHoverCapable() {
  const [capable, setCapable] = useState(false);
  useEffect(() => {
    setCapable(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return capable;
}

function SizeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SizeOption;
  onChange: (size: SizeOption) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-2">
      <span className="min-w-0 text-[0.65rem] font-semibold text-foreground sm:truncate sm:text-xs">
        {label}:
      </span>
      <div className="flex shrink-0 gap-1">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={value === size}
            onClick={() => onChange(size)}
            className={cn(
              "h-6 w-6 rounded-sm border text-[0.65rem] font-bold transition-colors sm:h-7 sm:w-8 sm:text-xs",
              value === size
                ? "border-petrol bg-petrol text-petrol-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const isBiquini = product.type === "biquini";
  const [size, setSize] = useState<SizeOption>("M");
  const [showBack, setShowBack] = useState(false);
  const hoverCapable = useHoverCapable();
  const hasBack = Boolean(product.backImage);
  const { addToCart, openCart } = useSiteUI();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const installmentValue = product.price / product.installments;

  function handleAddToCart() {
    addToCart({
      product,
      size: isBiquini ? size : "Único",
      stone: NO_STONE,
      pendant: NO_PENDANT,
    });
    openCart();
  }

  function handleTouchStart(event: TouchEvent) {
    if (!hasBack) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!hasBack || !start) return;

    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;

    // A vertical drag is the page scrolling — don't treat it as a swipe.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) return;
    if (elapsed > 700) return;

    event.preventDefault();
    setShowBack((value) => !value);
    navigator.vibrate?.(8);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-card">
      <div
        className="relative aspect-4/5 overflow-hidden bg-muted sm:aspect-3/4"
        onMouseEnter={hoverCapable ? () => setShowBack(true) : undefined}
        onMouseLeave={hoverCapable ? () => setShowBack(false) : undefined}
        onTouchStart={!hoverCapable ? handleTouchStart : undefined}
        onTouchEnd={!hoverCapable ? handleTouchEnd : undefined}
      >
        {product.frontImage ? (
          <>
            <img
              src={product.frontImage}
              alt={
                isBiquini
                  ? `${product.model} cor ${product.color}`
                  : `${product.model} ${product.color}`
              }
              loading="lazy"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-[400ms] ease-out",
                showBack && hasBack ? "opacity-0" : "opacity-100",
              )}
            />
            {product.backImage ? (
              <img
                src={product.backImage}
                alt={`${product.model} cor ${product.color}, vista de costas`}
                loading="lazy"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-[opacity,scale] duration-[400ms] ease-out",
                  showBack ? "scale-105 opacity-100" : "scale-100 opacity-0",
                )}
              />
            ) : null}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center px-4 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Foto em breve
          </div>
        )}
        {product.badge ? (
          <span className="absolute top-3 left-3 rounded-sm bg-hotpink px-2 py-1 text-[0.6rem] font-bold tracking-wide text-hotpink-foreground uppercase">
            {product.badge}
          </span>
        ) : null}
        {!hoverCapable && hasBack ? (
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                showBack ? "bg-white/45" : "bg-white",
              )}
            />
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                showBack ? "bg-white" : "bg-white/45",
              )}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-2.5 pt-3 text-center sm:px-4 sm:pt-4">
        <h3 className="text-[0.7rem] font-bold tracking-wide text-foreground uppercase sm:text-sm">
          {product.model}
        </h3>
        <p className="mt-0.5 text-[0.65rem] font-bold tracking-wide text-brandblue uppercase sm:mt-1 sm:text-sm">
          {isBiquini ? `Cor: ${product.color}` : product.color}
        </p>
        <p className="mt-1.5 text-base font-bold text-foreground sm:mt-2 sm:text-xl">
          {formatBRL(product.price)}
        </p>
        {product.installments > 1 ? (
          <p className="mt-0.5 text-[0.6rem] tracking-wide text-muted-foreground uppercase sm:text-xs">
            {product.installments} x de {formatBRL(installmentValue)} sem juros
          </p>
        ) : null}

        {isBiquini ? (
          <div className="mt-3 rounded-md border border-border p-2 sm:mt-4 sm:p-3">
            <SizeRow label="Tamanho" value={size} onChange={setSize} />
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-3 mb-3 w-full rounded-sm bg-petrol px-2 py-2 text-[0.65rem] font-bold tracking-[0.04em] text-petrol-foreground uppercase transition-colors hover:bg-petrol/90 sm:mt-4 sm:mb-5 sm:px-4 sm:py-3 sm:text-sm sm:tracking-[0.1em]"
        >
          Adicionar à sacola
        </button>
      </div>
    </article>
  );
}
