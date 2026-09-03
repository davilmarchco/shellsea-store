import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductType } from "@/data/products";

export interface CartLine {
  key: string;
  product: Product;
  size: string;
  stone: string;
  pendant: string;
  qty: number;
}

export type CartLineInput = Omit<CartLine, "key" | "qty">;

interface SiteUIState {
  activeCatalog: ProductType | null;
  openCatalog: (type: ProductType) => void;
  closeCatalog: () => void;

  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  cartLines: CartLine[];
  cartCount: number;
  addToCart: (line: CartLineInput) => void;
  removeFromCart: (key: string) => void;
  setLineQty: (key: string, qty: number) => void;
  clearCart: () => void;

  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;

  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

const SiteUIContext = createContext<SiteUIState | null>(null);

function lineKey(line: CartLineInput) {
  return [line.product.id, line.size, line.stone, line.pendant].join("::");
}

export function SiteUIProvider({ children }: { children: ReactNode }) {
  const [activeCatalog, setActiveCatalog] = useState<ProductType | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const addToCart = useCallback((line: CartLineInput) => {
    const key = lineKey(line);
    setCartLines((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (existing) {
        return current.map((entry) =>
          entry.key === key ? { ...entry, qty: entry.qty + 1 } : entry,
        );
      }
      return [...current, { ...line, key, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCartLines((current) => current.filter((entry) => entry.key !== key));
  }, []);

  const setLineQty = useCallback((key: string, qty: number) => {
    setCartLines((current) =>
      qty <= 0
        ? current.filter((entry) => entry.key !== key)
        : current.map((entry) => (entry.key === key ? { ...entry, qty } : entry)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartLines([]);
  }, []);

  const cartCount = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty, 0), [cartLines]);

  const value = useMemo<SiteUIState>(
    () => ({
      activeCatalog,
      openCatalog: (type) => setActiveCatalog(type),
      closeCatalog: () => setActiveCatalog(null),

      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      cartLines,
      cartCount,
      addToCart,
      removeFromCart,
      setLineQty,
      clearCart,

      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),

      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),

      quickViewProduct,
      openQuickView: (product) => setQuickViewProduct(product),
      closeQuickView: () => setQuickViewProduct(null),
    }),
    [
      activeCatalog,
      cartOpen,
      cartLines,
      cartCount,
      addToCart,
      removeFromCart,
      setLineQty,
      clearCart,
      authOpen,
      searchOpen,
      quickViewProduct,
    ],
  );

  return <SiteUIContext.Provider value={value}>{children}</SiteUIContext.Provider>;
}

export function useSiteUI() {
  const ctx = useContext(SiteUIContext);
  if (!ctx) throw new Error("useSiteUI must be used within a SiteUIProvider");
  return ctx;
}
