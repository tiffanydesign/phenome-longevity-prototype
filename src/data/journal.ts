import type { DataPair } from "@/lib/data";

/**
 * Health Journal static data (Activity / Diet / Habits).
 * Interactions (logged workouts, meals, habit completions) live in journal-store.ts.
 */

// ---------------------------------------------------------------- activity

export interface Sport {
  id: string;
  name: string;
  /** public/assets/icons/<icon>.svg */
  icon: string;
}

/**
 * "Select Activity" list. The first ten rows are exactly what activity_add/top shows;
 * the rest continues alphabetically with the remaining APK sport icons.
 */
export const SPORTS: Sport[] = [
  { id: "archery", name: "Archery", icon: "archery" },
  { id: "badminton", name: "Badminton", icon: "playing_badminton" },
  { id: "barre", name: "Barre", icon: "stretch_01" },
  { id: "baseball", name: "Baseball", icon: "playing_baseball" },
  { id: "basketball", name: "Basketball", icon: "playing_basketball" },
  { id: "bowling", name: "Bowling", icon: "playing_bowling" },
  { id: "boxing", name: "Boxing", icon: "boxing" },
  { id: "climbing", name: "Climbing", icon: "rock_climbing" },
  { id: "cooldown", name: "Cooldown", icon: "stretch_02" },
  { id: "core-training", name: "Core Training", icon: "plank_pose" },
  // TODO(fidelity): rows below Core Training were never captured — names/icons inferred from the APK icon set.
  { id: "curling", name: "Curling", icon: "playing_curling" },
  { id: "cycling", name: "Cycling", icon: "biking" },
  { id: "dance", name: "Dance", icon: "dancing" },
  { id: "diving", name: "Diving", icon: "diving" },
  { id: "elliptical", name: "Elliptical", icon: "elliptical_training" },
  { id: "fencing", name: "Fencing", icon: "fencing" },
  { id: "fishing", name: "Fishing", icon: "fishing" },
  { id: "functional-strength", name: "Functional Strength Training", icon: "exercise_dumbbells" },
  { id: "golf", name: "Golf", icon: "playing_golf" },
  { id: "hiit", name: "High Intensity Interval Training", icon: "fitness" },
  { id: "hiking", name: "Hiking", icon: "hiking" },
  { id: "hockey", name: "Hockey", icon: "playing_hockey" },
  { id: "jump-rope", name: "Jump Rope", icon: "jump_rope_activity" },
  { id: "kayaking", name: "Kayaking", icon: "kayaking" },
  { id: "martial-arts", name: "Martial Arts", icon: "taekwondo_01" },
  { id: "mind-body", name: "Mind and Body", icon: "meditation" },
  { id: "pilates", name: "Pilates", icon: "stretch_03" },
  { id: "rugby", name: "Rugby", icon: "playing_rugby" },
  { id: "running", name: "Running", icon: "run" },
  { id: "sailing", name: "Sailing", icon: "sailing" },
  { id: "shooting", name: "Shooting", icon: "shooting" },
  { id: "skating", name: "Skating", icon: "speed_skating" },
  { id: "skiing", name: "Skiing", icon: "alpine_skiing" },
  { id: "snowboarding", name: "Snowboarding", icon: "freestyle_skiing" },
  { id: "soccer", name: "Soccer", icon: "playing_soccer" },
  { id: "stairs", name: "Stair Climbing", icon: "climbing_stairs" },
  { id: "strength", name: "Strength Training", icon: "barbells_02" },
  { id: "surfing", name: "Surfing", icon: "surfing" },
  { id: "swimming", name: "Swimming", icon: "swimming" },
  { id: "table-tennis", name: "Table Tennis", icon: "table_tennis" },
  { id: "tennis", name: "Tennis", icon: "playing_tennis" },
  { id: "volleyball", name: "Volleyball", icon: "playing_volleyball" },
  { id: "walking", name: "Walking", icon: "walk" },
  { id: "water-polo", name: "Water Polo", icon: "playing_water_polo" },
  { id: "yoga", name: "Yoga", icon: "tree_pose" },
];

export const sportById = (id: string): Sport => SPORTS.find((s) => s.id === id) ?? SPORTS[0];

/**
 * Live-timer burn rate. Captures: 6 s → 1 kcal, 9 s → 2 kcal, 24 s → 4 kcal ≈ 10 kcal/min.
 * TODO(fidelity): the app derives this from profile weight + MET; flat rate here.
 */
export const KCAL_PER_SECOND = 10 / 60;

// ---------------------------------------------------------------- diet

export type MealId = "breakfast" | "lunch" | "dinner" | "snacks";
export const MEALS: { id: MealId; name: string }[] = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
  { id: "snacks", name: "Snacks" },
];

/** Nutrients per 100 g. */
export interface Food {
  id: string;
  name: string;
  desc: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  calcium: number; // mg
  iron: number; // mg
}

/**
 * Daily reference values used for the "%" column / bars. Chosen so the captured food
 * (Shrimp garden salad at 100 g and 110 g) reproduces every label in meal_log/item_detail
 * and meal_summary/top. TODO(fidelity): real reference table not visible in the app.
 */
export const DAILY_REF = { protein: 50, fat: 65, carbs: 300, fiber: 25, calcium: 1000, iron: 18 };

export const CALORIE_GOAL = 2000;
export const WEIGHT_STEP = 10;

/** Search "eggs" → meal_log/search_results (first 7 rows captured). */
export const FOODS: Food[] = [
  // Values reverse-engineered from meal_log/item_detail (100 g → 63 kcal, 8 g P, 2 g F, 2 g C, 0 g fibre, 67 mg Ca).
  { id: "shrimp-salad-1", name: "Shrimp garden salad", desc: "shrimp, lettuce, eggs, tomato and/or carrots, other vegetables, no dressing", kcal: 63, protein: 8.2, fat: 2.0, carbs: 2.5, fiber: 0.9, calcium: 67, iron: 1.0 },
  // TODO(fidelity): nutrients for the rows below were not opened on device — plausible values.
  { id: "shrimp-salad-2", name: "Shrimp garden salad", desc: "shrimp, lettuce, eggs, vegetables excluding tomato and carrots, no dressing", kcal: 60, protein: 8.0, fat: 2.0, carbs: 2.0, fiber: 0.8, calcium: 60, iron: 1.0 },
  { id: "seafood-salad-1", name: "Seafood garden salad with seafood", desc: "lettuce, eggs, vegetables excluding tomato and carrots, no dressing", kcal: 71, protein: 9.1, fat: 2.6, carbs: 2.2, fiber: 0.8, calcium: 55, iron: 1.1 },
  { id: "seafood-salad-2", name: "Seafood garden salad with seafood", desc: "lettuce, eggs, tomato and/or carrots, other vegetables, no dressing", kcal: 73, protein: 9.0, fat: 2.6, carbs: 2.9, fiber: 1.0, calcium: 58, iron: 1.1 },
  { id: "julienne", name: "Julienne salad", desc: "meat, cheese, eggs, vegetables, no dressing", kcal: 112, protein: 10.4, fat: 6.7, carbs: 2.6, fiber: 0.9, calcium: 120, iron: 0.9 },
  { id: "livers", name: "Livers", desc: "chicken, chopped, with eggs and onion", kcal: 179, protein: 15.6, fat: 11.3, carbs: 3.1, fiber: 0.3, calcium: 25, iron: 7.1 },
  { id: "seven-layer", name: "Seven-layer salad", desc: "lettuce salad made with a combination of onion, celery, green pepper, peas, mayonnaise, cheese, eggs, and/or bacon", kcal: 151, protein: 4.9, fat: 12.7, carbs: 4.6, fiber: 1.4, calcium: 80, iron: 0.6 },
  { id: "eggs-scrambled", name: "Egg, whole, scrambled", desc: "made with butter", kcal: 149, protein: 10.0, fat: 11.0, carbs: 1.6, fiber: 0, calcium: 66, iron: 1.3 },
  { id: "eggs-boiled", name: "Egg, whole, boiled or poached", desc: "no added fat", kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0, calcium: 50, iron: 1.8 },
];

export function searchFoods(q: string): Food[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return FOODS.filter((f) => `${f.name} ${f.desc}`.toLowerCase().includes(s));
}

export const DIET_COPY = {
  intro:
    "Consistent meal logging often reflects mindful eating and awareness of nutrition habits. Short-term changes are common and usually influenced by appetite, social events, or routine changes.",
  noCompare: "There is no recorded activity to compare for these periods.",
  sections: [
    {
      title: "Understanding Calorie Intake",
      body: "Calories represent the energy your body uses to function. They fuel everything from breathing and circulation to movement and exercise. The right intake supports your goals — whether that's performance, recovery, maintenance, or body composition changes.",
    },
    {
      title: "Why Nutrition Matters",
      body: "The food you eat provides more than just energy. Nutrients like protein, carbohydrates, fats, vitamins, and minerals support muscle repair, brain function, hormone balance, and overall recovery. Consistent, balanced nutrition helps your body perform, adapt, and stay resilient.",
    },
    {
      title: "How Food Affects Your Body",
      body: "Your nutrition choices directly influence energy levels, sleep quality, recovery, and long-term health. Undereating may impact performance and recovery, while overeating over time may affect body composition. Balance and consistency matter more than short-term fluctuations.",
    },
  ],
};

// ---------------------------------------------------------------- habits

export interface Habit {
  id: string;
  name: string;
  notes?: string;
}

export const HABITS_COPY =
  "Consistent habit tracking often reflects self-awareness and commitment to daily routines. Short-term changes are common and usually influenced by schedule shifts, stress, travel, or lifestyle changes.";

export const HABIT_NAME_MAX = 100;

/** Default habits seeded by the app (journal_habits/top). */
export const DEFAULT_HABITS: Habit[] = [
  { id: "water", name: "Drink a glass of water" },
  { id: "stretch", name: "Take 5 minutes to stretch" },
  { id: "plan", name: "Plan tomorrow's main goal" },
];

// ---------------------------------------------------------------- seeds (real vs demo)

export interface JournalSeed {
  activities: { sportId: string; start: number; seconds: number }[];
  meals: { meal: MealId; foodId: string; grams: number; at: number }[];
  completedHabitIds: string[];
}

const hoursAgo = (h: number) => Date.now() - h * 3600_000;

export const journalSeed: DataPair<JournalSeed> = {
  real: { activities: [], meals: [], completedHabitIds: [] },
  // DEMO — populated journal for design work.
  demo: {
    activities: [
      { sportId: "running", start: hoursAgo(6), seconds: 32 * 60 + 14 },
      { sportId: "yoga", start: hoursAgo(3), seconds: 20 * 60 },
    ],
    meals: [
      { meal: "breakfast", foodId: "eggs-scrambled", grams: 120, at: hoursAgo(7) },
      { meal: "lunch", foodId: "julienne", grams: 250, at: hoursAgo(3) },
    ],
    completedHabitIds: ["water", "stretch"],
  },
};
