import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES, PRODUCTS } from "@/data/products";
import { ProductCard } from "./ProductCard";

const SORT_OPTIONS = ["Mais recentes", "Menor preço", "Maior preço", "Nome A-Z"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

/** Catalog grid with category sidebar and client-side sorting. */
export function Catalog() {
  const [category, setCategory] = useState<string>("Todos");
  const [sort, setSort] = useState<SortOption>("Mais recentes");

  const products = useMemo(() => {
    const filtered =
      category === "Todos" ? [...PRODUCTS] : PRODUCTS.filter((p) => p.color === category);

    switch (sort) {
      case "Menor preço":
        return filtered.sort((a, b) => a.price - b.price);
      case "Maior preço":
        return filtered.sort((a, b) => b.price - a.price);
      case "Nome A-Z":
        return filtered.sort((a, b) =>
          `${a.model} ${a.color}`.localeCompare(`${b.model} ${b.color}`, "pt-BR"),
        );
      default:
        return filtered;
    }
  }, [category, sort]);

  return (
    <section id="catalogo" className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-[0.2em] text-foreground uppercase sm:text-3xl">
          Nossa Coleção
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          Biquínis artesanais em crochê, feitos à mão para acompanhar você do mar ao pôr do sol.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
              Categorias
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {CATEGORIES.map((item) => (
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

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
