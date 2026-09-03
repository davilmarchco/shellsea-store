import { cn } from "@/lib/utils";
import shellSeaLogo from "@/assets/shellsea-logo.png";

export interface ShellSeaLogoProps {
  className?: string;
}

/** Shell Sea beachwear brand logo. */
export function ShellSeaLogo({ className }: ShellSeaLogoProps) {
  return (
    <img
      src={shellSeaLogo}
      alt="Shell Sea Beachwear"
      className={cn("h-auto w-full object-contain drop-shadow-[0_2px_12px_oklch(0.19_0.01_260_/_0.4)]", className)}
    />
  );
}
