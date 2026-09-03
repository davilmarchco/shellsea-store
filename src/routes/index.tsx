import { createFileRoute } from "@tanstack/react-router";
import { MarqueeBar } from "@/components/MarqueeBar";
import { Hero } from "@/components/Hero";
import { BiquiniShowcase } from "@/components/BiquiniShowcase";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { AboutSection } from "@/components/AboutSection";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { DiscountPopup } from "@/components/DiscountPopup";
import { CatalogOverlay } from "@/components/CatalogOverlay";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { SearchOverlay } from "@/components/SearchOverlay";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shell Sea Beachwear | Biquínis exclusivos feitos à mão" },
      {
        name: "description",
        content:
          "Biquínis artesanais da Shell Sea, com pingentes e pedras para completar seu conjunto. Parcele em até 3x sem juros.",
      },
      { property: "og:title", content: "Shell Sea Beachwear | Biquínis exclusivos feitos à mão" },
      {
        property: "og:description",
        content:
          "Coleção de biquínis artesanais feitos à mão, com pedras e pingentes para completar seu conjunto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <MarqueeBar />
      <main>
        <Hero />
        <BiquiniShowcase />
        <CategoryShowcase />
        <section id="quem-somos" className="bg-background px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-cream px-6 py-12 sm:px-10 sm:py-16">
            <AboutSection />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppButton />
      <DiscountPopup />
      <CatalogOverlay />
      <CartDrawer />
      <AuthModal />
      <SearchOverlay />
    </div>
  );
}
