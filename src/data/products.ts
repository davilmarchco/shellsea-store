import mareRoyalFront from "@/assets/products/mare-royal-front.jpg";
import mareRoyalBack from "@/assets/products/mare-royal-back.jpg";
import marePretoFront from "@/assets/products/mare-preto-front.jpg";
import marePretoBack from "@/assets/products/mare-preto-back.jpg";
import mareChocolateFront from "@/assets/products/mare-chocolate-front.jpg";
import mareChocolateBack from "@/assets/products/mare-chocolate-back.jpg";
import mareAreiaFront from "@/assets/products/mare-areia-front.jpg";
import mareAreiaBack from "@/assets/products/mare-areia-back.jpg";
import orlaAzulBebeFront from "@/assets/products/orla-azul-bebe-front.jpg";
import orlaAzulBebeBack from "@/assets/products/orla-azul-bebe-back.jpg";
import orlaCastanhoFront from "@/assets/products/orla-castanho-front.jpg";
import orlaCastanhoBack from "@/assets/products/orla-castanho-back.jpg";
import orlaCerejaFront from "@/assets/products/orla-cereja-front.jpg";
import orlaCerejaBack from "@/assets/products/orla-cereja-back.jpg";
import orlaOffWhiteFront from "@/assets/products/orla-off-white-front.jpg";
import orlaOffWhiteBack from "@/assets/products/orla-off-white-back.jpg";
import orlaRosaBebeFront from "@/assets/products/orla-rosa-bebe-front.jpg";
import orlaRosaBebeBack from "@/assets/products/orla-rosa-bebe-back.jpg";
import orlaVerdeLimaoFront from "@/assets/products/orla-verde-limao-front.jpg";
import orlaVerdeLimaoBack from "@/assets/products/orla-verde-limao-back.jpg";
import pingenteSolDourado from "@/assets/products/pingente-sol-dourado.jpg";
import pingenteEstrelaDourada from "@/assets/products/pingente-estrela-dourada.jpg";
import pingenteConchaSerena from "@/assets/products/pingente-concha-serena.jpg";
import pingenteConchaBrisa from "@/assets/products/pingente-concha-brisa.jpg";
import pedraVerdeMenta from "@/assets/products/pedra-verde-menta.jpg";
import pedraAzulPetroleo from "@/assets/products/pedra-azul-petroleo.jpg";
import pedraAzulMarinho from "@/assets/products/pedra-azul-marinho.jpg";
import pedraMiniLaranja from "@/assets/products/pedra-mini-laranja.jpg";
import pedraMiniVerdeMenta from "@/assets/products/pedra-mini-verde-menta.jpg";
import pedraAmbar from "@/assets/products/pedra-ambar.jpg";
import pedraMiniAmbar from "@/assets/products/pedra-mini-ambar.jpg";

export type SizeOption = "P" | "M" | "G";

export const SIZES: readonly SizeOption[] = ["P", "M", "G"] as const;

/** The three shopping lanes shown in the category vitrine. */
export type ProductType = "biquini" | "pingente" | "pedra";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  biquini: "Biquínis",
  pingente: "Pingentes",
  pedra: "Pedras",
};

export interface Product {
  id: string;
  type: ProductType;
  model: string;
  /** Color for biquinis, or the design/variant name for pingentes and pedras. */
  color: string;
  /** Small badge shown over the photo, e.g. the collection name. */
  badge?: string;
  price: number;
  installments: number;
  /** Front-facing product photo. Empty while the catalog photos are pending. */
  frontImage?: string;
  /** Back-facing product photo, revealed on hover (desktop) or tap (mobile). */
  backImage?: string;
}

const BASE = {
  type: "biquini",
  model: "Biquíni Maré",
  badge: "MARÉ",
  price: 79.9,
  installments: 3,
} as const;
const ORLA_BASE = {
  type: "biquini",
  model: "Biquíni Orla",
  badge: "ORLA",
  price: 79.9,
  installments: 3,
} as const;
const PINGENTE_BASE = {
  type: "pingente",
  model: "Pingente",
  installments: 1,
} as const;
const PEDRA_BASE = {
  type: "pedra",
  model: "Pedra",
  installments: 1,
} as const;
const MINI_PEDRA_BASE = {
  type: "pedra",
  model: "Mini Pedra",
  installments: 1,
} as const;

export const PRODUCTS: readonly Product[] = [
  {
    id: "mare-royal",
    color: "Royal",
    frontImage: mareRoyalBack,
    backImage: mareRoyalFront,
    ...BASE,
  },
  {
    id: "mare-preto",
    color: "Preto",
    frontImage: marePretoFront,
    backImage: marePretoBack,
    ...BASE,
  },
  {
    id: "mare-chocolate",
    color: "Chocolate",
    frontImage: mareChocolateBack,
    backImage: mareChocolateFront,
    ...BASE,
  },
  {
    id: "mare-areia",
    color: "Areia",
    frontImage: mareAreiaFront,
    backImage: mareAreiaBack,
    ...BASE,
  },
  {
    id: "orla-azul-bebe",
    color: "Azul Bebê",
    frontImage: orlaAzulBebeFront,
    backImage: orlaAzulBebeBack,
    ...ORLA_BASE,
  },
  {
    id: "orla-castanho",
    color: "Castanho",
    frontImage: orlaCastanhoFront,
    backImage: orlaCastanhoBack,
    ...ORLA_BASE,
  },
  {
    id: "orla-cereja",
    color: "Cereja",
    frontImage: orlaCerejaFront,
    backImage: orlaCerejaBack,
    ...ORLA_BASE,
  },
  {
    id: "orla-off-white",
    color: "Off-White",
    frontImage: orlaOffWhiteFront,
    backImage: orlaOffWhiteBack,
    ...ORLA_BASE,
  },
  {
    id: "orla-rosa-bebe",
    color: "Rosa-Bebê",
    frontImage: orlaRosaBebeFront,
    backImage: orlaRosaBebeBack,
    ...ORLA_BASE,
  },
  {
    id: "orla-verde-limao",
    color: "Verde-Limão",
    frontImage: orlaVerdeLimaoFront,
    backImage: orlaVerdeLimaoBack,
    ...ORLA_BASE,
  },
  {
    id: "pingente-sol-dourado",
    color: "Sol Dourado",
    price: 6,
    frontImage: pingenteSolDourado,
    ...PINGENTE_BASE,
  },
  {
    id: "pingente-estrela-dourada",
    color: "Estrela Dourada",
    price: 1.5,
    frontImage: pingenteEstrelaDourada,
    ...PINGENTE_BASE,
  },
  {
    id: "pingente-concha-serena",
    color: "Concha Serena",
    price: 2,
    frontImage: pingenteConchaSerena,
    ...PINGENTE_BASE,
  },
  {
    id: "pingente-concha-brisa",
    color: "Concha Brisa",
    price: 3,
    frontImage: pingenteConchaBrisa,
    ...PINGENTE_BASE,
  },
  {
    id: "pedra-verde-menta",
    color: "Verde Menta",
    price: 2,
    frontImage: pedraVerdeMenta,
    ...PEDRA_BASE,
  },
  {
    id: "pedra-azul-petroleo",
    color: "Azul Petróleo",
    price: 2,
    frontImage: pedraAzulPetroleo,
    ...PEDRA_BASE,
  },
  {
    id: "pedra-azul-marinho",
    color: "Azul Marinho",
    price: 2,
    frontImage: pedraAzulMarinho,
    ...PEDRA_BASE,
  },
  {
    id: "pedra-mini-laranja",
    color: "Laranja",
    price: 1.5,
    frontImage: pedraMiniLaranja,
    ...MINI_PEDRA_BASE,
  },
  {
    id: "pedra-mini-verde-menta",
    color: "Verde Menta",
    price: 1.5,
    frontImage: pedraMiniVerdeMenta,
    ...MINI_PEDRA_BASE,
  },
  {
    id: "pedra-ambar",
    color: "Âmbar",
    price: 2,
    frontImage: pedraAmbar,
    ...PEDRA_BASE,
  },
  {
    id: "pedra-mini-ambar",
    color: "Âmbar",
    price: 1.5,
    frontImage: pedraMiniAmbar,
    ...MINI_PEDRA_BASE,
  },
];

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
