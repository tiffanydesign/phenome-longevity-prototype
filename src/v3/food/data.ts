/*
 * What the food pages know: a small ingredient table (per 100 g), the dishes a
 * scan can recognise, the day's targets, and a week of demo meals built from
 * those dishes so every number on the pages adds up from the same rows.
 */

export type Slot = "breakfast" | "lunch" | "dinner" | "snack";
export type NutrientId = "protein" | "carbs" | "fat" | "fiber" | "calcium" | "iron";

/** One ingredient, per 100 g. */
export interface Food {
  id: string;
  name: string;
  /** a short note under the name in search */
  desc?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** mg */
  calcium: number;
  /** mg */
  iron: number;
}

export interface Portion {
  food: string;
  grams: number;
}

export interface Dish {
  id: string;
  name: string;
  photo: string;
  items: Portion[];
  /** one plain sentence of why this plate matters for the member */
  note: string;
  /** where each food sits in the dish's scene photo (0–1), for the live scan tags */
  tags?: { food: string; x: number; y: number }[];
  /** the full-screen photo the camera opens on */
  scene?: string;
}

export const SLOTS: { id: Slot; name: string }[] = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
  { id: "snack", name: "Snacks" },
];
export const slotName = (s: Slot) => SLOTS.find((x) => x.id === s)?.name ?? "Meal";

/** The slot a meal falls in by the hour it was eaten. */
export function slotAt(d: Date): Slot {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 10.5) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 17.5) return "snack";
  return "dinner";
}

/** Default daily targets (the Balanced split at 2,000 kcal). Energy is the member's "diet" goal (goals.tsx); the rest are theirs to change in targets.ts. */
export const TARGET: Record<NutrientId, number> & { kcal: number } = {
  kcal: 1750,
  protein: 110,
  carbs: 225,
  fat: 73,
  fiber: 30,
  calcium: 1000,
  iron: 18,
};

/** How each nutrient is named, measured and coloured. Protein coral red, carbs yellow, fibre green and fat cream fill rings, bars and charts; `ink` is the same colour taken deep enough to read as text or a small icon on a white card (the cream above all). Calcium and iron keep their own hues. */
export const NUTRIENT: Record<NutrientId, { name: string; short: string; unit: string; hue: string; ink?: string }> = {
  protein: { name: "Protein", short: "Protein", unit: "g", hue: "#e16162", ink: "#c0464a" },
  carbs: { name: "Carbohydrates", short: "Carbs", unit: "g", hue: "#faae2b", ink: "#b0740a" },
  fat: { name: "Fat", short: "Fat", unit: "g", hue: "#f3d2c1", ink: "#b5765a" },
  fiber: { name: "Fibre", short: "Fibre", unit: "g", hue: "#7ccf9a", ink: "#3c9262" },
  calcium: { name: "Calcium", short: "Calcium", unit: "mg", hue: "#30b0c7" },
  iron: { name: "Iron", short: "Iron", unit: "mg", hue: "#fa3c5a" },
};
export const MACROS: NutrientId[] = ["protein", "carbs", "fat"];
export const MICROS: NutrientId[] = ["fiber", "calcium", "iron"];

const f = (id: string, name: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number, calcium: number, iron: number, desc?: string): Food => ({
  id,
  name,
  desc,
  kcal,
  protein,
  carbs,
  fat,
  fiber,
  calcium,
  iron,
});

export const FOODS: Food[] = [
  f("sourdough", "Sourdough toast", 260, 9, 50, 2, 2.5, 30, 2, "toasted, no butter"),
  f("avocado", "Avocado", 160, 2, 9, 15, 7, 12, 0.6, "raw"),
  f("egg-fried", "Egg, fried", 196, 13.6, 0.8, 15, 0, 56, 1.9, "in a little oil"),
  f("egg-boiled", "Egg, boiled", 143, 12.6, 0.7, 9.5, 0, 50, 1.8, "no added fat"),
  f("yogurt", "Greek yogurt", 97, 9, 4, 5, 0, 110, 0.1, "plain, full fat"),
  f("blueberries", "Blueberries", 57, 0.7, 14, 0.3, 2.4, 6, 0.3, "fresh"),
  f("flat-white", "Flat white", 60, 3.3, 4.8, 3.2, 0, 120, 0, "whole milk, per 100 ml"),
  f("salmon", "Salmon", 206, 22, 0, 12, 0, 15, 0.3, "cooked"),
  f("brown-rice", "Brown rice", 112, 2.6, 23, 0.9, 1.8, 10, 0.4, "cooked"),
  f("edamame", "Edamame", 121, 12, 9, 5, 5, 63, 2.3, "shelled"),
  f("cucumber", "Cucumber", 15, 0.7, 3.6, 0.1, 0.5, 16, 0.3),
  f("red-cabbage", "Red cabbage", 31, 1.4, 7, 0.2, 2.1, 45, 0.8, "shredded"),
  f("corn", "Sweetcorn", 96, 3.4, 21, 1.5, 2.4, 3, 0.5),
  f("tomato", "Cherry tomatoes", 18, 0.9, 3.9, 0.2, 1.2, 10, 0.3),
  f("sesame-dressing", "Soy sesame dressing", 300, 3, 14, 26, 0.8, 40, 1.2),
  f("chickpeas", "Chickpeas", 164, 8.9, 27, 2.6, 7.6, 49, 2.9, "cooked"),
  f("sweet-potato", "Sweet potato", 90, 2, 21, 0.2, 3.3, 38, 0.7, "roasted"),
  f("greens", "Mixed greens", 20, 1.5, 3.5, 0.3, 1.8, 40, 1, "spinach, rocket, lettuce"),
  f("radish", "Radish", 16, 0.7, 3.4, 0.1, 1.6, 25, 0.3),
  f("tahini", "Tahini dressing", 595, 17, 21, 54, 9, 426, 9),
  f("prawns", "Prawns", 99, 24, 0.2, 0.3, 0, 70, 0.5, "cooked"),
  f("curry-sauce", "Coconut curry sauce", 150, 2, 8, 12, 1.5, 20, 1.5),
  f("jasmine-rice", "Jasmine rice", 130, 2.7, 28, 0.3, 0.4, 10, 0.2, "steamed"),
  f("brioche-toast", "Brioche French toast", 280, 8, 33, 13, 1.2, 80, 1.6),
  f("banana", "Banana", 89, 1.1, 23, 0.3, 2.6, 5, 0.3),
  f("maple", "Maple syrup", 260, 0, 67, 0.1, 0, 102, 0.1),
  f("pomegranate", "Pomegranate seeds", 83, 1.7, 19, 1.2, 4, 10, 0.3),
  f("feta", "Feta", 264, 14, 4, 21, 0, 493, 0.7),
  f("almonds", "Almonds", 579, 21, 22, 50, 12.5, 269, 3.7, "a small handful is 30 g"),
  f("apple", "Apple", 52, 0.3, 14, 0.2, 2.4, 6, 0.1, "with skin"),
  f("oats", "Porridge oats", 71, 2.5, 12, 1.5, 1.7, 9, 0.9, "made with water"),
  f("chicken", "Chicken breast", 165, 31, 0, 3.6, 0, 15, 1, "grilled"),
  f("lentil-soup", "Lentil soup", 76, 4.5, 11, 1.5, 3.5, 20, 1.6),
  f("zucchini", "Courgette noodles", 17, 1.2, 3.1, 0.3, 1, 16, 0.4, "raw, spiralised"),
  f("carrot", "Carrot", 41, 0.9, 10, 0.2, 2.8, 33, 0.3, "grated"),
  f("kale", "Kale", 49, 4.3, 8.8, 0.9, 3.6, 150, 1.5, "massaged"),
  f("yogurt-strawberry", "Strawberry yogurt pot", 98, 4.2, 13, 3, 0.4, 130, 0.1, "per 100 g, pot is 120 g"),
];
export const foodOf = (id: string): Food => FOODS.find((x) => x.id === id) ?? FOODS[0];

const photo = (n: string) => `${import.meta.env.BASE_URL}assets/photos/food/${n}.jpg`;

export const DISHES: Dish[] = [
  {
    id: "egg-plate",
    name: "Egg and avocado plate",
    photo: photo("egg-plate"),
    scene: photo("scene-plate"),
    items: [
      { food: "egg-boiled", grams: 100 },
      { food: "avocado", grams: 70 },
      { food: "tomato", grams: 90 },
      { food: "zucchini", grams: 90 },
      { food: "kale", grams: 45 },
      { food: "carrot", grams: 40 },
    ],
    tags: [
      { food: "avocado", x: 0.46, y: 0.22 },
      { food: "kale", x: 0.82, y: 0.3 },
      { food: "tomato", x: 0.2, y: 0.38 },
      { food: "egg-boiled", x: 0.8, y: 0.465 },
      { food: "zucchini", x: 0.24, y: 0.54 },
    ],
    note: "Two eggs and avocado give steady energy; kale and tomatoes add calcium, iron and fibre.",
  },
  {
    id: "egg-toast",
    name: "Avocado toast with fried egg",
    photo: photo("egg-toast"),
    items: [
      { food: "sourdough", grams: 70 },
      { food: "avocado", grams: 72 },
      { food: "egg-fried", grams: 50 },
    ],
    note: "A steady start: the egg and avocado slow how fast the toast reaches your blood sugar.",
  },
  {
    id: "salmon-bowl",
    name: "Salmon poke bowl",
    photo: photo("salmon-bowl"),
    items: [
      { food: "salmon", grams: 110 },
      { food: "brown-rice", grams: 150 },
      { food: "edamame", grams: 50 },
      { food: "corn", grams: 40 },
      { food: "tomato", grams: 40 },
      { food: "cucumber", grams: 40 },
      { food: "red-cabbage", grams: 30 },
      { food: "sesame-dressing", grams: 15 },
    ],
    note: "Salmon brings omega-3 fats and a third of your protein for the day.",
  },
  {
    id: "buddha-bowl",
    name: "Chickpea power bowl",
    photo: photo("buddha-bowl"),
    items: [
      { food: "chickpeas", grams: 80 },
      { food: "sweet-potato", grams: 90 },
      { food: "avocado", grams: 50 },
      { food: "greens", grams: 40 },
      { food: "tomato", grams: 40 },
      { food: "red-cabbage", grams: 30 },
      { food: "radish", grams: 20 },
      { food: "tahini", grams: 15 },
    ],
    note: "Nearly half a day of fibre, mostly from chickpeas and greens. Fibre feeds the gut bacteria your kit measured.",
  },
  {
    id: "shrimp-curry",
    name: "Prawn curry with rice",
    photo: photo("shrimp-curry"),
    items: [
      { food: "prawns", grams: 120 },
      { food: "curry-sauce", grams: 150 },
      { food: "jasmine-rice", grams: 150 },
    ],
    note: "Lean protein from the prawns; most of the fat sits in the coconut sauce.",
  },
  {
    id: "french-toast",
    name: "French toast with berries",
    photo: photo("french-toast"),
    items: [
      { food: "brioche-toast", grams: 120 },
      { food: "banana", grams: 60 },
      { food: "blueberries", grams: 40 },
      { food: "maple", grams: 20 },
    ],
    note: "A sweeter plate: pairing it with protein later keeps the afternoon dip away.",
  },
  {
    id: "green-salad",
    name: "Green salad with feta",
    photo: photo("green-salad"),
    items: [
      { food: "greens", grams: 120 },
      { food: "avocado", grams: 50 },
      { food: "pomegranate", grams: 40 },
      { food: "feta", grams: 40 },
      { food: "sweet-potato", grams: 60 },
    ],
    note: "Light and high in calcium thanks to the feta.",
  },
];
export const dishOf = (id: string) => DISHES.find((d) => d.id === id);

export type Totals = { kcal: number } & Record<NutrientId, number>;
export const ZERO: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0 };

/** Nutrients of a list of portions, scaled by servings. */
export function totalsOf(items: Portion[], servings = 1): Totals {
  const t = { ...ZERO };
  for (const p of items) {
    const x = foodOf(p.food);
    const k = (p.grams / 100) * servings;
    t.kcal += x.kcal * k;
    t.protein += x.protein * k;
    t.carbs += x.carbs * k;
    t.fat += x.fat * k;
    t.fiber += x.fiber * k;
    t.calcium += x.calcium * k;
    t.iron += x.iron * k;
  }
  return t;
}

export function addTotals(a: Totals, b: Totals): Totals {
  const t = { ...a };
  (Object.keys(t) as (keyof Totals)[]).forEach((k) => (t[k] += b[k]));
  return t;
}

export function searchFoods(q: string): Food[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return FOODS.filter((x) => `${x.name} ${x.desc ?? ""}`.toLowerCase().includes(s));
}

export const fmt = (n: number) => Math.round(n).toLocaleString("en-GB");
export const grams = (n: number, unit = "g") => `${n < 10 ? Math.round(n * 10) / 10 : Math.round(n)} ${unit}`;

export const ABOUT = [
  {
    title: "Understanding calorie intake",
    body: "Calories are the energy your body uses to breathe, circulate blood, move and recover. The right amount depends on your goal: performance, recovery, keeping steady or changing body composition.",
  },
  {
    title: "Why nutrition matters",
    body: "Food brings more than energy. Protein, carbohydrates, fats, vitamins and minerals support muscle repair, brain function, hormone balance and recovery.",
  },
  {
    title: "How food affects your body",
    body: "What you eat shapes energy, sleep and recovery. Balance and consistency matter more than any single day.",
  },
];
