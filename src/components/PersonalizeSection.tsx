import { Gem, Ruler, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Ruler,
    title: "Escolha o tamanho",
    text: "Top e calcinha independentes, de P a GG, para o caimento perfeito.",
  },
  {
    icon: Gem,
    title: "Escolha a pedra",
    text: "Pedras naturais que dão personalidade e brilho para a sua peça.",
  },
  {
    icon: Sparkles,
    title: "Escolha o pingente",
    text: "Conchas e pingentes artesanais para finalizar do seu jeito.",
  },
] as const;

/** Explains the customization flow available on every product card. */
export function PersonalizeSection() {
  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-[0.2em] text-foreground uppercase sm:text-3xl">
          Personalize seu biquíni
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 text-center transition-colors hover:bg-accent/40"
            >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-brandblue">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-sm font-bold tracking-wide text-foreground uppercase">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
