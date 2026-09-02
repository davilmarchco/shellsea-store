import { cn } from "@/lib/utils";

export interface ShellSeaLogoProps {
  className?: string;
}

/**
 * Typographic rendition of the Shell Sea beachwear signature logo:
 * script wordmark split by a shell mark, underlined "beachwear" tagline.
 */
export function ShellSeaLogo({ className }: ShellSeaLogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex items-end justify-center gap-1 text-primary-foreground drop-shadow-[0_2px_12px_oklch(0.19_0.01_260_/_0.55)]">
        <span className="font-script text-[clamp(3rem,11vw,6.5rem)] leading-[0.85]">She</span>
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="mb-[0.12em] h-[clamp(2rem,7vw,4.2rem)] w-auto text-primary-foreground"
        >
          <path
            fill="currentColor"
            d="M32 4c3.6 0 6 2.6 6 6v6.6c8.9 2.6 15.4 9.9 17.6 19.1 1.3 5.4 1.1 10.9-.6 15.8-.7 2-2.6 3.3-4.7 3.3H13.7c-2.1 0-4-1.3-4.7-3.3-1.7-4.9-1.9-10.4-.6-15.8C10.6 26.5 17.1 19.2 26 16.6V10c0-3.4 2.4-6 6-6Zm0 6c-1 0-1.4.5-1.4 1.5v42.3h2.8V11.5c0-1-.4-1.5-1.4-1.5ZM26 21.9c-6.6 2.6-11.4 8.4-13.1 15.7-1 4.3-.9 8.6.3 12.5.2.6.7 1 1.3 1H26V21.9Zm12 0v29.2h11.5c.6 0 1.1-.4 1.3-1 1.2-3.9 1.3-8.2.3-12.5-1.7-7.3-6.5-13.1-13.1-15.7Z"
          />
        </svg>
        <span className="font-script text-[clamp(3rem,11vw,6.5rem)] leading-[0.85]">sea</span>
      </div>
      <div className="mt-1 flex w-full items-center justify-center gap-3 text-primary-foreground drop-shadow-[0_2px_12px_oklch(0.19_0.01_260_/_0.55)]">
        <span className="h-px w-8 bg-current sm:w-12" />
        <span className="text-[clamp(0.7rem,2vw,1.05rem)] font-medium tracking-[0.35em] lowercase">
          beachwear
        </span>
        <span className="h-px w-8 bg-current sm:w-12" />
      </div>
    </div>
  );
}
