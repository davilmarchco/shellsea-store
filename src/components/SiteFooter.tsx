const NAV_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Monte seu Conjunto", href: "#vitrine" },
  { label: "Sobre Nós", href: "#quem-somos" },
  { label: "@shellseabeachwear", href: "https://instagram.com/shellseabeachwear", external: true },
] as const;

const SUPPORT_ITEMS = [
  { label: "🌺 Atendimento WhatsApp", href: "https://wa.me/5521993734339", external: true },
  { label: "Tabela de Medidas" },
  { label: "Personalização de Biquínis", href: "#vitrine" },
] as const;

const PAYMENT_ITEMS = [
  { label: "💳 Em até 3x Sem Juros" },
  { label: "⚡ 4% OFF no Pix" },
  { label: "🏷️ 10% OFF Primeira Compra (Cupom: MAR DE CONCHAS)" },
] as const;

const linkClass =
  "inline-block text-sm text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white";
const headingClass = "text-sm font-extrabold tracking-[0.12em] text-white uppercase";

export function SiteFooter() {
  return (
    <footer id="contato" className="bg-[#0c0c0c] py-14 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-4 md:gap-8">
        <div className="space-y-3">
          <p className={headingClass}>Shell Sea Beachwear</p>
          <p className="text-sm text-white/70">
            Marca de Niterói • Compra 100% pelo site • Atendimento personalizado
          </p>
        </div>

        <div className="space-y-3">
          <p className={headingClass}>Navegação</p>
          <ul className="space-y-2">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={"external" in item && item.external ? "_blank" : undefined}
                  rel={"external" in item && item.external ? "noopener noreferrer" : undefined}
                  className={linkClass}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className={headingClass}>Contato &amp; Suporte</p>
          <ul className="space-y-2">
            {SUPPORT_ITEMS.map((item) =>
              "href" in item ? (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={"external" in item && item.external ? "_blank" : undefined}
                    rel={"external" in item && item.external ? "noopener noreferrer" : undefined}
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={item.label} className="text-sm text-white/70">
                  {item.label}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <p className={headingClass}>Pagamento &amp; Benefícios</p>
          <ul className="space-y-2">
            {PAYMENT_ITEMS.map((item) => (
              <li key={item.label} className="text-sm text-white/70">
                {item.label.includes("MAR DE CONCHAS") ? (
                  <>
                    {item.label.split("MAR DE CONCHAS")[0]}
                    <strong className="font-bold text-white">MAR DE CONCHAS</strong>
                    {item.label.split("MAR DE CONCHAS")[1]}
                  </>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-4 pt-6 sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} SheLL sea beachwear - Niterói, RJ. Todos os direitos
            reservados.
          </p>
          <p>Loja Oficial SheLL Sea — compra 100% pelo site.</p>
        </div>
      </div>
    </footer>
  );
}
