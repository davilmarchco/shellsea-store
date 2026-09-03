const MESSAGES = [
  "NA COMPRA DE 1 BIQUÍNI, GANHE UMA PEDRA OU PINGENTE PARA PERSONALIZAR",
  'RESGATE SEU CUPOM "MARDECONCHAS" PARA 10% OFF NA PRIMEIRA COMPRA',
  "PARCELE EM ATÉ 3X SEM JUROS",
];

/**
 * Top announcement bar with an infinite horizontal marquee.
 * The message list is duplicated so the -50% translate loops seamlessly.
 */
export function MarqueeBar() {
  const loop = [...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES];

  return (
    <div className="overflow-hidden bg-hotpink py-2 text-hotpink-foreground">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {loop.map((message, index) => (
              <span
                key={`${copy}-${index}`}
                className="px-8 font-heading text-[0.7rem] font-semibold tracking-wide sm:text-xs"
              >
                {message}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
