import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { PRODUCTS, type ProductType } from "@/data/products";
import { useSiteUI } from "@/lib/site-ui";
import { Reveal } from "./Reveal";

const pingenteSolDourado = PRODUCTS.find((p) => p.id === "pingente-sol-dourado");
const pedraVerdeMenta = PRODUCTS.find((p) => p.id === "pedra-verde-menta");

const CATEGORY_CARDS: readonly {
  type: ProductType;
  title: string;
  subtitle: string;
  gradient: string;
  image?: string | undefined;
}[] = [
  {
    type: "pingente",
    title: "Pingentes",
    subtitle: "Personalize com detalhes únicos",
    gradient: "from-coral via-hotpink/80 to-coral/70",
    image: pingenteSolDourado?.frontImage,
  },
  {
    type: "pedra",
    title: "Pedras",
    subtitle: "Brilho e acabamento para dar um toque especial ao seu look",
    gradient: "from-teal via-cream/40 to-petrol",
    image: pedraVerdeMenta?.frontImage,
  },
] as const;

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Vitrine for the two personalization lanes: pingentes and pedras. */
export function CategoryShowcase() {
  const { openCatalog } = useSiteUI();

  return (
    <section className="bg-background px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="text-center font-script text-2xl text-hotpink sm:text-3xl">
            Complete o seu conjunto
          </p>
        </Reveal>

        <motion.div
          className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {CATEGORY_CARDS.map((card) => (
            <motion.button
              key={card.title}
              type="button"
              onClick={() => openCatalog(card.type)}
              variants={cardVariants}
              className="group relative block aspect-4/5 overflow-hidden rounded-2xl text-left shadow-lg"
            >
              {card.image ? (
                <>
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 h-full w-full scale-100 object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-55 backdrop-blur-[1px] transition-opacity duration-500 ease-out group-hover:opacity-45",
                      card.gradient,
                    )}
                  />
                </>
              ) : (
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105",
                    card.gradient,
                  )}
                />
              )}
              <div className="absolute inset-0 bg-foreground/15" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <h3 className="font-display text-4xl font-bold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.5)] sm:text-5xl">
                  {card.title}
                </h3>
                <p className="text-sm font-medium text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
                  {card.subtitle}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
