import { ChevronDown, Search, ShoppingBag, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSiteUI } from "@/lib/site-ui";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Início", href: "#inicio", hasDropdown: false },
  { label: "Sobre Nós", href: "#quem-somos", hasDropdown: false },
  { label: "Coleções", href: "#vitrine", hasDropdown: true },
] as const;

/** Transparent header that sits over the hero image. */
export function SiteHeader() {
  const { openSearch, openAuth, openCart, cartCount } = useSiteUI();
  const { session } = useAuth();

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <a
          href="#inicio"
          className="min-w-0 truncate text-xl font-extrabold tracking-[0.15em] text-primary-foreground sm:text-2xl"
        >
          SHELL SEA
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-foreground/95 transition-opacity hover:opacity-70"
            >
              {item.label}
              {item.hasDropdown ? <ChevronDown className="h-4 w-4" /> : null}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-4 text-primary-foreground lg:gap-6">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Buscar"
            className="transition-opacity hover:opacity-70"
          >
            <Search className="h-5 w-5" />
          </button>
          {session ? (
            <Link
              to="/minha-conta"
              aria-label="Minha conta"
              className="transition-opacity hover:opacity-70"
            >
              <User className="h-5 w-5 fill-current" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={openAuth}
              aria-label="Entrar ou criar conta"
              className="transition-opacity hover:opacity-70"
            >
              <User className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label="Sacola de compras"
            className="relative transition-opacity hover:opacity-70"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 grid h-4 w-4 place-items-center rounded-full bg-hotpink text-[0.6rem] font-bold text-hotpink-foreground">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
