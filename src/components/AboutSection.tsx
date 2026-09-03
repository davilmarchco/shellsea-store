import { Reveal } from "./Reveal";

/** "Quem somos nós?" content: brand story, text-only. */
export function AboutSection() {
  return (
    <Reveal>
      <h2 className="text-center font-script text-4xl text-hotpink sm:text-5xl">Quem somos nós?</h2>

      <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
        <p>
          O nome SheLL Sea carrega um significado muito especial. <em>Shell</em>, em inglês,
          significa concha, um dos elementos que mais representa o universo do mar e a inspiração da
          nossa marca. Shell + Sea, o nosso "mar de conchas"! 🌊🐚
        </p>
        <p>
          Mas existe um detalhe ainda mais importante: os dois{" "}
          <strong className="font-bold text-coral">"L"</strong> maiúsculos em{" "}
          <strong className="font-bold text-coral">SheLL</strong> representam{" "}
          <strong className="font-bold text-foreground">Lara</strong> e{" "}
          <strong className="font-bold text-foreground">Laura</strong>. 🌺
        </p>
        <p>
          Mais do que uma marca de moda praia, a SheLL Sea nasceu no litoral do Rio de Janeiro,
          criada por nós duas, com carinho, criatividade e a vontade de trazer peças que tenham a
          nossa essência — e que também possam fazer parte da sua.
        </p>
      </div>
    </Reveal>
  );
}
