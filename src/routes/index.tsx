import { createFileRoute } from "@tanstack/react-router";
import { MarqueeBar } from "@/components/MarqueeBar";
import { Hero } from "@/components/Hero";
import { Catalog } from "@/components/Catalog";
import { PersonalizeSection } from "@/components/PersonalizeSection";
import { AboutSection } from "@/components/AboutSection";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shell Sea Beachwear | Biquínis de crochê feitos à mão" },
      {
        name: "description",
        content:
          "Biquínis de crochê artesanais da Shell Sea: personalize tamanho, pedra e pingente. Parcele em até 3x sem juros.",
      },
      { property: "og:title", content: "Shell Sea Beachwear | Biquínis de crochê feitos à mão" },
      {
        property: "og:description",
        content:
          "Coleção de biquínis de crochê feitos à mão, com pedras e pingentes personalizáveis.",
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
        <Catalog />
        <PersonalizeSection />
        <AboutSection />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
