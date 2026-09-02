const MESSAGES = [
  'USE O CUPOM DE PRIMEIRA COMPRA "MAR DE CONCHAS"',
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
                className="px-8 text-[0.7rem] font-bold tracking-wide sm:text-xs"
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
