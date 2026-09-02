import { Instagram, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-petrol py-10 text-petrol-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 text-center sm:px-6">
        <p className="text-lg font-extrabold tracking-[0.2em] uppercase">Shell Sea</p>
        <p className="text-sm text-petrol-foreground/80">
          Biquínis de crochê feitos à mão · Rio de Janeiro
        </p>
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da Shell Sea"
            className="transition-opacity hover:opacity-70"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="mailto:contato@shellsea.com"
            aria-label="E-mail da Shell Sea"
            className="transition-opacity hover:opacity-70"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>
        <p className="text-xs text-petrol-foreground/60">
          © {new Date().getFullYear()} Shell Sea Beachwear. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
