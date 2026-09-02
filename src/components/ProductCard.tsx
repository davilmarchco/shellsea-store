import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  PENDANT_OPTIONS,
  SIZES,
  STONE_OPTIONS,
  formatBRL,
  type Product,
  type SizeOption,
} from "@/data/products";

export interface ProductCardProps {
  product: Product;
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <span className="min-w-0 truncate text-xs font-semibold text-foreground">{label}:</span>
      <div className="flex shrink-0 gap-1">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={value === size}
            onClick={() => onChange(size)}
            className={cn(
              "h-7 w-8 rounded-sm border text-xs font-bold transition-colors",
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

function SelectRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <label className="min-w-0 truncate text-xs font-semibold text-foreground">{label}:</label>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="w-[9.5rem] shrink-0 rounded-sm border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const [top, setTop] = useState<SizeOption>("M");
  const [bottom, setBottom] = useState<SizeOption>("M");
  const [stone, setStone] = useState<string>(STONE_OPTIONS[0] ?? "Nenhuma");
  const [pendant, setPendant] = useState<string>(PENDANT_OPTIONS[0] ?? "Nenhum");

  const installmentValue = product.price / product.installments;

  return (
    <article className="flex flex-col bg-card">
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        {product.image ? (
          <img
            src={product.image}
            alt={`${product.model} cor ${product.color}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
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
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4 text-center">
        <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
          {product.model}
        </h3>
        <p className="mt-1 text-sm font-bold tracking-wide text-brandblue uppercase">
          Cor: {product.color}
        </p>
        <p className="mt-2 text-xl font-bold text-foreground">{formatBRL(product.price)}</p>
        <p className="mt-1 text-sm font-bold text-pix">
          {formatBRL(product.pixPrice)}{" "}
          <span className="text-muted-foreground uppercase">com Pix</span>
        </p>
        <p className="mt-0.5 text-xs tracking-wide text-muted-foreground uppercase">
          {product.installments} x de {formatBRL(installmentValue)} sem juros
        </p>

        <div className="mt-4 space-y-2 rounded-md border border-border p-3">
          <SizeRow label="Top" value={top} onChange={setTop} />
          <SizeRow label="Calcinha" value={bottom} onChange={setBottom} />
          <SelectRow label="Pedra" options={STONE_OPTIONS} value={stone} onChange={setStone} />
          <SelectRow
            label="Pingente"
            options={PENDANT_OPTIONS}
            value={pendant}
            onChange={setPendant}
          />
        </div>

        <button
          type="button"
          className="mt-4 mb-5 w-full rounded-sm bg-petrol px-4 py-3 text-sm font-bold tracking-[0.1em] text-petrol-foreground uppercase transition-colors hover:bg-petrol/90"
        >
          Adicionar à sacola
        </button>
      </div>
    </article>
  );
}
