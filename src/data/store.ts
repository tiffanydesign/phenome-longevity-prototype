import type { DataPair } from "@/lib/data";

/**
 * Wellness Store catalogue — names, prices and order exactly as listed in
 * capture/screens/tab_store/top … scroll_7 (XML content-desc). Photos are cropped from the
 * captures (network images) into public/assets/photos/store/ at 1:1 device px.
 */
export type Category = "Testing" | "Devices" | "Supplements";

export interface Swatch {
  name: string;
  /** flat swatch colour measured from product_device/size_selected */
  color: string;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  /** NOK, two decimals */
  price: number;
  category: Category;
  /** photos/store/<photo> — grid card image (562×455 device px) */
  photo: string;
  /** detail carousel: main image + thumbnails + dot count */
  gallery?: Gallery;
  description?: string;
  /** "Buy 2, save 10%" banner (Testing products, capture product_test/top) */
  bundle?: boolean;
  finishes?: { group: string; swatches: Swatch[] }[];
  sizes?: string[];
}

export interface Gallery {
  main: string;
  thumbs: string[];
  /** number of carousel pages (dots); only the first image + visible thumbs were captured */
  count: number;
}

const slug = (n: string) =>
  n
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const P = (name: string, price: number, category: Category, extra: Partial<Product> = {}): Product => ({
  id: slug(name),
  name,
  price,
  category,
  photo: `${slug(name)}.jpg`,
  bundle: category === "Testing" || undefined,
  ...extra,
});

const gallery = (key: string, count: number): Gallery => ({
  main: `detail-${key}.jpg`,
  thumbs: Array.from({ length: 6 }, (_, i) => `thumb-${key}-${i}.jpg`),
  count,
});

/** capture: product_device/top — 41 carousel pages before a finish is chosen, 16 for Metal Black */
export const RING_GALLERY: Record<string, Gallery> = {
  default: gallery("ring", 41),
  "Metal Black": gallery("ring-metal-black", 16),
};

const RING_FINISHES: Product["finishes"] = [
  {
    group: "Metal",
    swatches: [
      { name: "Metal Black", color: "#4a4b4a", available: true },
      { name: "Metal Silver", color: "#b4b5b9", available: true },
      { name: "Metal Brushed silver", color: "#9a9a9b", available: false },
      { name: "Metal Gold", color: "#d4b982", available: true },
    ],
  },
  {
    group: "Matte",
    swatches: [
      { name: "Matte Rose", color: "#cca9a3", available: false },
      { name: "Matte Stealth black", color: "#414141", available: false },
    ],
  },
  {
    group: "Ceramic",
    swatches: [
      { name: "Ceramic Black", color: "#15171b", available: true },
      { name: "Ceramic Pink", color: "#eac9ce", available: true },
      { name: "Ceramic White", color: "#dce0e7", available: true },
    ],
  },
];

const PRODUCTS: Product[] = [
  P("Comprehensive Genomic Test", 8530, "Testing", {
    gallery: gallery("comprehensive-genomic-test", 16),
    description:
      "Your DNA holds the key to understanding your health, longevity, and wellness potential. The Phenome Longevity Lifelong Health Test provides a comprehensive genetic analysis, helping you uncover insights into your metabolism, disease risk, fitness potential, and more—so you can make smarter health choices for the future.",
  }),
  P("Carrier Screening Test", 8530, "Testing"),
  P("Newborn Screening Test", 8530, "Testing"),
  P("Sports Performance Test", 8530, "Testing"),
  P("Gut Microbiome Test", 2620, "Testing"),
  P("Oral Microbiome Test", 2620, "Testing"),
  P("PhenomeTech Ring", 2350, "Devices", {
    gallery: RING_GALLERY.default,
    description:
      "The PhenomeTech Ring is a sleek, lightweight wearable designed to track your health around the clock. It continuously monitors key signals such as sleep, activity, heart rate, and recovery, turning complex biological data into simple, actionable insights. By combining advanced sensors with intelligent analysis, the PhenomeTech Ring helps you understand your body better, so you can optimise performance, manage stress, and support long term wellbeing.",
    finishes: RING_FINISHES,
    sizes: ["6", "7", "8", "9", "10", "11", "12", "13"],
  }),
  P("PhenomeTech Band", 1960, "Devices"),
  P("Phenome+ Liposomal Curcumin", 599, "Supplements"),
  P("Phenome+ Liposomal Vitamin D3+K2", 509, "Supplements", {
    gallery: gallery("phenome-plus-liposomal-vitamin-d3-plus-k2", 9),
    description:
      "Vegan liposomal vitamin D3 and K2 with zinc and selenium, for strong bones, healthy muscles and immune support. 3,000 IU in one orange sachet a day.",
  }),
  P("Liposomal Iron", 599, "Supplements"),
  P("Phenome+ Liposomal Magnesium", 659, "Supplements"),
  P("Liposomal NAD+", 729, "Supplements"),
  P("Phenome+ Liposomal Vitamin C", 529, "Supplements"),
  P("Phenome+ Liposomal Vollagen", 619, "Supplements"),
  P("Broccoli Complex Capsules", 289, "Supplements"),
  P("Guarana Capsules", 289, "Supplements"),
  P("Quercetin Capsules", 359, "Supplements"),
  P("Pelargonium Throat Lozenges", 139, "Supplements"),
  P("Propolis Throat Lozenges", 149, "Supplements"),
  P("Throat Relief Lozenges", 119, "Supplements"),
  P("Bromelain Capsules", 529, "Supplements"),
  P("Joint Boost Capsules", 399, "Supplements"),
];

// The live catalogue is identical for the test account and for design work.
export const storeProducts: DataPair<Product[]> = { real: PRODUCTS, demo: PRODUCTS };

export const findProduct = (id: string | undefined) => PRODUCTS.find((p) => p.id === id);

export const CATEGORIES = ["All Products", "Testing", "Devices", "Supplements"] as const;
export type CategoryTab = (typeof CATEGORIES)[number];

/** flat shipping shown in cart/top */
export const SHIPPING = 20;

/** "kr8530.00" (grid, cart totals) */
export const kr = (n: number) => `kr${n.toFixed(2)}`;
/** "kr 2350.00" (product detail price, cart line total) */
export const krs = (n: number) => `kr ${n.toFixed(2)}`;

/** Checkout prefill — account holder name (allowed per brief). */
export const CHECKOUT_NAME = "Tiffany Shi";
