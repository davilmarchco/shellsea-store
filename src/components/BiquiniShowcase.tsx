import { Reveal } from "./Reveal";
import { CatalogView } from "./CatalogView";

/** Full biquini catalog, shown directly on the home page right below the hero. */
export function BiquiniShowcase() {
  return (
    <section id="vitrine" className="bg-background">
      <div className="px-4 pt-14 sm:px-6 sm:pt-20">
        <Reveal>
          <p className="text-center font-script text-2xl text-hotpink sm:text-3xl">
            Seu biquíni, suas escolhas, sua concha.
          </p>
          <p className="mx-auto mt-2 whitespace-nowrap text-center text-[clamp(0.7rem,3vw,1rem)] text-muted-foreground">
            Escolha o seu conjunto e personalize do jeito que quiser
          </p>
        </Reveal>
      </div>

      <CatalogView type="biquini" showHeader={false} />
    </section>
  );
}
