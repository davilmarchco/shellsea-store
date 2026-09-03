import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useSiteUI } from "@/lib/site-ui";
import { CatalogView } from "./CatalogView";

/** Full-screen catalog takeover opened from a CategoryShowcase card or the header nav. */
export function CatalogOverlay() {
  const { activeCatalog, closeCatalog } = useSiteUI();
  useBodyScrollLock(activeCatalog !== null);

  return (
    <AnimatePresence>
      {activeCatalog ? (
        <motion.div
          className="fixed inset-0 z-40 overflow-y-auto bg-background"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-end border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={closeCatalog}
              aria-label="Fechar catálogo"
              className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground transition-transform hover:scale-105"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <CatalogView type={activeCatalog} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
