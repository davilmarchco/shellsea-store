import aboutDesktop from "@/assets/about-desktop.jpg.asset.json";
import aboutMobile from "@/assets/about-mobile.jpg.asset.json";

/** "Quem somos nós?" section: brand story over the beach photo. */
export function AboutSection() {
  return (
    <section id="quem-somos" className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center font-script text-4xl text-coral sm:text-5xl">Quem somos nós?</h2>

        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            A Shell Sea nasceu do encontro entre duas amigas, o mar e o crochê feito à mão. Cada
            biquíni é criado ponto por ponto, pensando no caimento, no conforto e naquela
            sensação de liberdade de um dia inteiro de praia.
          </p>
          <p>
            Trabalhamos com peças em pequenas quantidades, cores autorais e detalhes em conchas e
            pedras naturais — para que cada peça seja tão única quanto quem a veste.
          </p>
        </div>

        <figure className="relative mt-10 overflow-hidden rounded-2xl">
          <picture>
            <source media="(min-width: 768px)" srcSet={aboutDesktop.url} />
            <img
              src={aboutMobile.url}
              alt="Duas amigas na praia usando biquínis de crochê da Shell Sea"
              loading="lazy"
              className="h-[22rem] w-full object-cover object-center sm:h-[26rem] lg:h-[30rem]"
            />
          </picture>
        </figure>
      </div>
    </section>
  );
}
