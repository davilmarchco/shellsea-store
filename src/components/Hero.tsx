import { motion } from "framer-motion";
import heroPhoto from "@/assets/hero-photo.jpg";
import { EASE_OUT } from "@/lib/motion";
import { SiteHeader } from "./SiteHeader";
import { ShellSeaLogo } from "./ShellSeaLogo";

/**
 * Full-bleed hero: responsive background photo, centered brand logo,
 * CTA button and the wavy divider that blends into the page background.
 */
export function Hero() {
  return (
    <section id="inicio" className="relative isolate min-h-[90svh] overflow-hidden lg:min-h-[97svh]">
      <img
        src={heroPhoto}
        alt="Praia de águas cristalinas cercada por mata atlântica"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-foreground/15" />

      <SiteHeader />

      <div className="relative z-10 flex min-h-[90svh] flex-col items-center justify-center gap-8 px-6 py-28 lg:min-h-[97svh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        >
          <ShellSeaLogo className="w-[min(70vw,26rem)]" />
        </motion.div>
        <motion.a
          href="#vitrine"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT }}
          className="rounded-full bg-primary/85 px-12 py-4 text-sm font-bold tracking-[0.15em] text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary"
        >
          CONFIRA
        </motion.a>
      </div>

      {/* Wave divider: wide, smooth, uniform crests — 3 on mobile, 4 on desktop. */}
      <svg
        className="absolute inset-x-0 bottom-0 z-10 h-16 w-full text-background sm:hidden"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,68 c120,0 120,-48 240,-48 c120,0 120,48 240,48 c120,0 120,-48 240,-48 c120,0 120,48 240,48 c120,0 120,-48 240,-48 c120,0 120,48 240,48 L1440,140 L0,140 Z"
        />
      </svg>
      <svg
        className="absolute inset-x-0 bottom-0 z-10 hidden h-24 w-full text-background sm:block"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,68 c90,0 90,-48 180,-48 c90,0 90,48 180,48 c90,0 90,-48 180,-48 c90,0 90,48 180,48 c90,0 90,-48 180,-48 c90,0 90,48 180,48 c90,0 90,-48 180,-48 c90,0 90,48 180,48 L1440,140 L0,140 Z"
        />
      </svg>
    </section>
  );
}
