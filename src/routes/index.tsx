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
import { ProductQuickView } from "@/components/ProductQuickView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SheLL Sea | Beachwear" },
      {
        name: "description",
        content:
          "Biquínis artesanais da SheLL Sea, com pingentes e pedras para completar seu conjunto. Parcele em até 3x sem juros.",
      },
      { property: "og:title", content: "SheLL Sea | Beachwear" },
      {
        property: "og:description",
        content:
          "Coleção de biquínis artesanais feitos à mão, com pedras e pingentes para completar seu conjunto.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.png" },
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
      <ProductQuickView />
    </div>
  );
}
