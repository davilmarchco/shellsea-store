import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { PRODUCTS, type ProductType } from "@/data/products";
import { ProductCard } from "./ProductCard";

const SORT_OPTIONS = ["Mais recentes", "Menor preço", "Maior preço", "Nome A-Z"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

const CATALOG_COPY: Record<
  ProductType,
  { title: string; subtitle: string; empty: string; promo?: string }
> = {
  biquini: {
    title: "Biquínis exclusivos feitos à mão",
    subtitle:
      "Peças exclusivas, feitas à mão em Niterói — para você montar o conjunto do seu jeito.",
    empty: "Nenhum biquíni encontrado para esse filtro.",
  },
  pingente: {
    title: "Pingentes SheLL Sea",
    subtitle: "Detalhes artesanais para finalizar o seu biquíni do seu jeito.",
    empty: "Novos pingentes chegando em breve.",
    promo:
      "O biquíni acompanha uma pedra ou pingente à sua escolha gratuitamente. Adicione outros acessórios pelo valor de cada peça.",
  },
  pedra: {
    title: "Pedras SheLL Sea",
    subtitle: "Brilho e acabamento exclusivos para personalizar sua peça com o estilo do mar.",
    empty: "Novas pedras chegando em breve.",
    promo:
      "O biquíni acompanha uma pedra ou pingente à sua escolha gratuitamente. Adicione outros acessórios pelo valor de cada peça.",
  },
};

/** Product grid for one shopping lane (biquini/pingente/pedra), with sidebar filters. */
export function CatalogView({
  type,
  showHeader = true,
}: {
  type: ProductType;
  showHeader?: boolean;
}) {
  const [category, setCategory] = useState<string>("Todos");
  const [sort, setSort] = useState<SortOption>("Mais recentes");
  const copy = CATALOG_COPY[type];

  const byType = useMemo(() => PRODUCTS.filter((p) => p.type === type), [type]);
  const categoryOptions = useMemo(
    () => ["Todos", ...Array.from(new Set(byType.map((p) => p.color)))],
    [byType],
  );

  const products = useMemo(() => {
    const filtered = category === "Todos" ? byType : byType.filter((p) => p.color === category);

    switch (sort) {
      case "Menor preço":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "Maior preço":
        return [...filtered].sort((a, b) => b.price - a.price);
      case "Nome A-Z":
        return [...filtered].sort((a, b) =>
          `${a.model} ${a.color}`.localeCompare(`${b.model} ${b.color}`, "pt-BR"),
        );
      default:
        return filtered;
    }
  }, [byType, category, sort]);

  const hasAnyOfType = byType.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-14 sm:px-6 sm:pt-8 sm:pb-20">
      {showHeader ? (
        <>
          <h2 className="text-center font-heading text-[clamp(1.4rem,4vw,2.5rem)] font-semibold tracking-[0.15em] text-foreground uppercase">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center font-heading text-[clamp(0.85rem,2.4vw,1.05rem)] font-light tracking-wide text-muted-foreground italic">
            {copy.subtitle}
          </p>
        </>
      ) : null}

      {copy.promo ? (
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-primary/20 bg-accent px-5 py-4 text-center">
          <p className="text-sm font-semibold text-accent-foreground">{copy.promo}</p>
        </div>
      ) : null}

      {!hasAnyOfType ? (
        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-brandblue">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">{copy.empty}</p>

          <div className="mt-6 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid aspect-4/5 place-items-center rounded-xl border border-dashed border-border bg-muted/50 px-3 text-center text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase sm:aspect-3/4 sm:text-xs"
              >
                Em breve
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
              Categorias
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {categoryOptions.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setCategory(item)}
                    className={cn(
                      "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                      category === item
                        ? "bg-accent font-bold text-brandblue"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
              <p className="min-w-0 truncate text-xs tracking-wide text-muted-foreground uppercase">
                {products.length} produtos
              </p>
              <select
                aria-label="Ordenar por"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="shrink-0 rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {products.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              <motion.div
                className="mt-6 grid grid-cols-2 gap-3 px-3 sm:gap-x-6 sm:gap-y-10 sm:px-0 xl:grid-cols-3"
                variants={gridVariants}
                initial="hidden"
                animate="show"
              >
                {products.map((product) => (
                  <motion.div key={product.id} variants={cardVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
