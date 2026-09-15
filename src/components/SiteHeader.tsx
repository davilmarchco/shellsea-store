import { useState } from "react";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSiteUI } from "@/lib/site-ui";
import { useAuth } from "@/lib/auth";
import type { ProductType } from "@/data/products";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader as MobileSheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem =
  | { label: string; kind: "anchor"; href: string }
  | { label: string; kind: "catalog"; type: ProductType };

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Início", kind: "anchor", href: "#inicio" },
  { label: "Biquínis", kind: "anchor", href: "#vitrine" },
  { label: "Pedras", kind: "catalog", type: "pedra" },
  { label: "Pingentes", kind: "catalog", type: "pingente" },
  { label: "Sobre Nós", kind: "anchor", href: "#quem-somos" },
  { label: "Contato", kind: "anchor", href: "#contato" },
] as const;

/** One nav entry: a plain anchor for page sections, or a button that opens the
 * matching catalog overlay directly (no intermediate submenu). */
function NavLink({
  item,
  className,
  onNavigate,
}: {
  item: NavItem;
  className: string;
  onNavigate?: () => void;
}) {
  const { openCatalog } = useSiteUI();

  if (item.kind === "catalog") {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          openCatalog(item.type);
        }}
        className={className}
      >
        {item.label}
      </button>
    );
  }

  return (
    <a href={item.href} onClick={() => onNavigate?.()} className={className}>
      {item.label}
    </a>
  );
}

/** Transparent header that sits over the hero image. */
export function SiteHeader() {
  const { openSearch, openAuth, openCart, cartCount } = useSiteUI();
  const { session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="shrink-0 text-primary-foreground transition-opacity hover:opacity-70 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <a
            href="#inicio"
            className="min-w-0 truncate text-xl font-extrabold tracking-[0.15em] text-primary-foreground sm:text-2xl"
          >
            SHELL SEA
          </a>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              className="text-sm font-semibold text-primary-foreground/95 transition-opacity hover:opacity-70"
            />
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

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="flex w-4/5 max-w-xs flex-col gap-0 bg-background p-0">
          <MobileSheetHeader className="border-b border-border px-6 py-5 text-left">
            <SheetTitle className="text-lg font-extrabold tracking-[0.15em] text-foreground">
              SHELL SEA
            </SheetTitle>
            <SheetDescription className="sr-only">Menu de navegação</SheetDescription>
          </MobileSheetHeader>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                onNavigate={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-lg px-4 py-3 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted",
                )}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
