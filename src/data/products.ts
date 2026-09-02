export type SizeOption = "P" | "M" | "G" | "GG";

export const SIZES: readonly SizeOption[] = ["P", "M", "G", "GG"] as const;

/** Stone / pendant options. Extend as the catalog options are confirmed. */
export const STONE_OPTIONS: readonly string[] = ["Nenhuma"] as const;
export const PENDANT_OPTIONS: readonly string[] = ["Nenhum"] as const;

export interface Product {
  id: string;
  model: string;
  color: string;
  /** Small badge shown over the photo, e.g. the collection name. */
  badge?: string;
  price: number;
  pixPrice: number;
  installments: number;
  /** Product photo URL. Empty while the catalog photos are pending. */
  image?: string;
}

export const CATEGORIES: readonly string[] = [
  "Todos",
  "Chocolate",
  "Royal",
  "Rosa-Bebê",
  "Cereja",
  "Verde-Limão",
  "Castanho",
  "Off-White",
  "Preto*",
  "Turquesa*",
] as const;

const BASE = { price: 130, pixPrice: 124.8, installments: 3 } as const;

export const PRODUCTS: readonly Product[] = [
  { id: "mare-chocolate", model: "Biquíni Maré", color: "Chocolate", badge: "MARÉ", ...BASE },
  { id: "mare-royal", model: "Biquíni Maré", color: "Royal", badge: "MARÉ", ...BASE },
  { id: "orla-rosa-bebe", model: "Biquíni Orla", color: "Rosa-Bebê", badge: "ORLA", ...BASE },
  { id: "orla-cereja", model: "Biquíni Orla", color: "Cereja", badge: "ORLA", ...BASE },
  { id: "orla-verde-limao", model: "Biquíni Orla", color: "Verde-Limão", badge: "ORLA", ...BASE },
  { id: "orla-castanho", model: "Biquíni Orla", color: "Castanho", badge: "ORLA", ...BASE },
  { id: "orla-off-white", model: "Biquíni Orla", color: "Off-White", badge: "ORLA", ...BASE },
  {
    id: "shell-sea-preto",
    model: "Biquíni Shell Sea",
    color: "Preto (confirmar nome)",
    badge: "CONFIRMAR NOME",
    ...BASE,
  },
  {
    id: "shell-sea-turquesa",
    model: "Biquíni Shell Sea",
    color: "Turquesa (confirmar nome)",
    badge: "CONFIRMAR NOME",
    ...BASE,
  },
];

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
