import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { PRODUCTS, PRODUCT_TYPE_LABELS, formatBRL } from "@/data/products";

/** Live search across biquinis, pingentes and pedras by name/color. */
export function SearchOverlay() {
  const { searchOpen, closeSearch, openCatalog } = useSiteUI();
  const [query, setQuery] = useState("");
  useBodyScrollLock(searchOpen);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return PRODUCTS.filter(
      (p) => p.model.toLowerCase().includes(term) || p.color.toLowerCase().includes(term),
    ).slice(0, 8);
  }, [query]);

  function handleClose() {
    closeSearch();
    setQuery("");
  }

  return (
    <AnimatePresence>
      {searchOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/60 p-4 pt-24 backdrop-blur-sm sm:pt-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar produtos"
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-background shadow-2xl"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar biquínis, pingentes e pedras..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar busca"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-transform hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim() && results.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhum resultado para "{query}".
                </p>
              ) : null}

              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    handleClose();
                    openCatalog(product.type);
                  }}
                  className="flex w-full items-center gap-3 border-b border-border px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-muted"
                >
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {product.frontImage ? (
                      <img
                        src={product.frontImage}
                        alt={product.model}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {product.model} — {product.color}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[product.type]}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-foreground">
                    {formatBRL(product.price)}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
