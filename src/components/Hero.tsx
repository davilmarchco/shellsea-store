import heroDesktop from "@/assets/hero-desktop.jpg.asset.json";
import heroMobile from "@/assets/hero-mobile.jpg.asset.json";
import { SiteHeader } from "./SiteHeader";
import { ShellSeaLogo } from "./ShellSeaLogo";

/**
 * Full-bleed hero: responsive background photo, centered brand logo,
 * CTA button and the wavy divider that blends into the page background.
 */
export function Hero() {
  return (
    <section id="inicio" className="relative isolate min-h-[85svh] overflow-hidden lg:min-h-[92svh]">
      <picture>
        <source media="(min-width: 768px)" srcSet={heroDesktop.url} />
        <img
          src={heroMobile.url}
          alt="Praia de águas cristalinas cercada por mata atlântica"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
      </picture>
      <div className="absolute inset-0 bg-foreground/15" />

      <SiteHeader />

      <div className="relative z-10 flex min-h-[85svh] flex-col items-center justify-center gap-8 px-6 py-28 lg:min-h-[92svh]">
        <ShellSeaLogo className="w-[min(70vw,26rem)]" />
        <a
          href="#catalogo"
          className="rounded-full bg-primary/85 px-12 py-4 text-sm font-bold tracking-[0.15em] text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary"
        >
          CONFIRA
        </a>
      </div>

      <svg
        className="absolute inset-x-0 bottom-0 z-10 h-14 w-full text-background sm:h-20"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0 42c180-38 340 22 520 26s300-40 480-34 260 44 440 26v30H0z"
        />
      </svg>
    </section>
  );
}
