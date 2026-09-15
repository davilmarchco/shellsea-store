import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

/** Floating WhatsApp button — support and personalized service only, not checkout. */
export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5521993734339"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Atendimento e suporte no WhatsApp"
      className="fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
