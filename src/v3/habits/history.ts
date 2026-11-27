import { CLINIC_PLAN } from "./clinic";

/*
 * The member's plans over time. The care team writes a new plan after a
 * visit; the one before it ends that day and stays readable here. Only one
 * plan is active at a time.
 *
 * Follow-through is counted per day: a day counts as followed when at least
 * four in five of the plan's meals and doses were ticked or logged. Weeks
 * carry the share of followed days, oldest first.
 *
 * DEMO: mock history for the prototype; the portal export does not reach the app.
 */

export interface PlanMed {
  name: string;
  detail: string;
}

export interface PlanMealLine {
  name: string;
  time: string;
  kcal: number;
  choices: string[];
}

export interface PlanRecord {
  id: string;
  /** "18 Nov 2026" */
  from: string;
  /** the day it ended; absent while active */
  to?: string;
  goal: string;
  dietitian: string;
  doctor: string;
  note: string;
  kcal: number;
  macros: { carbs: number; protein: number; fat: number };
  meals: PlanMealLine[];
  meds: PlanMed[];
  /** what the next plan changed, read on the old plan as why it ended */
  changed?: string[];
  follow: { days: number; followed: number; weeks: number[] };
}

const CURRENT: PlanRecord = {
  id: "current",
  from: "18 Nov 2026",
  goal: CLINIC_PLAN.goal,
  dietitian: CLINIC_PLAN.dietitian,
  doctor: CLINIC_PLAN.doctor,
  note: CLINIC_PLAN.note,
  kcal: CLINIC_PLAN.kcal,
  macros: CLINIC_PLAN.macros,
  meals: CLINIC_PLAN.meals.map((m) => ({ name: m.name, time: m.time, kcal: m.kcal, choices: m.choices.map((c) => c.name) })),
  meds: [
    { name: "Morning vitamins", detail: "Vitamin D3 · Omega-3 · Magnesium" },
    { name: "Blood pressure tablet", detail: "Amlodipine 5 mg · with breakfast" },
    { name: "Metformin", detail: "500 mg · with breakfast and dinner" },
    { name: "Evening statin", detail: "Atorvastatin 20 mg · after dinner" },
  ],
  follow: { days: 9, followed: 7, weeks: [0.8, 0.75] },
};

const EARLIER: PlanRecord[] = [
  {
    id: "2026-09",
    from: "2 Sep 2026",
    to: "17 Nov 2026",
    goal: "Bring fasting glucose down",
    dietitian: "Elin Berg, dietitian",
    doctor: "Dr. Jonas Ek",
    note: "Spread carbohydrates over the day instead of one large dinner, and walk for ten minutes after your two biggest meals.",
    kcal: 1800,
    macros: { carbs: 210, protein: 85, fat: 62 },
    meals: [
      { name: "Breakfast", time: "07:30", kcal: 420, choices: ["Oats with milk and berries", "Wholegrain toast with egg and tomato"] },
      { name: "Lunch", time: "12:30", kcal: 520, choices: ["Chicken, brown rice and salad", "Bean and vegetable stew"] },
      { name: "Afternoon snack", time: "15:30", kcal: 180, choices: ["Yoghurt with fruit", "Carrots and hummus"] },
      { name: "Dinner", time: "18:30", kcal: 520, choices: ["Fish, potatoes and vegetables", "Lentil curry with rice"] },
      { name: "Evening snack", time: "21:00", kcal: 160, choices: ["Cottage cheese with berries"] },
    ],
    meds: [
      { name: "Morning vitamins", detail: "Vitamin D3 · Omega-3" },
      { name: "Blood pressure tablet", detail: "Amlodipine 5 mg · with breakfast" },
      { name: "Metformin", detail: "500 mg · with dinner" },
      { name: "Evening statin", detail: "Atorvastatin 20 mg · after dinner" },
    ],
    changed: ["Metformin raised to twice a day", "Energy goal 1,800 → 1,750 kcal", "Evening snack dropped, nuts added to the afternoon"],
    follow: { days: 77, followed: 58, weeks: [0.57, 0.71, 0.86, 0.86, 0.71, 0.57, 0.86, 1, 0.71, 0.71, 0.71] },
  },
  {
    id: "2026-06",
    from: "10 Jun 2026",
    to: "1 Sep 2026",
    goal: "Lower blood pressure",
    dietitian: "Sara Lind, dietitian",
    doctor: "Dr. Jonas Ek",
    note: "Less salt is the biggest lever: cook from scratch where you can and check bread and cheese labels for sodium.",
    kcal: 1900,
    macros: { carbs: 235, protein: 80, fat: 66 },
    meals: [
      { name: "Breakfast", time: "07:30", kcal: 450, choices: ["Muesli with yoghurt", "Rye bread with egg"] },
      { name: "Lunch", time: "12:30", kcal: 560, choices: ["Salmon salad with potatoes", "Vegetable soup with bread"] },
      { name: "Afternoon snack", time: "15:30", kcal: 200, choices: ["Fruit and unsalted nuts"] },
      { name: "Dinner", time: "18:30", kcal: 600, choices: ["Chicken, vegetables and bulgur", "Pasta with tomato and beans"] },
    ],
    meds: [
      { name: "Morning vitamins", detail: "Vitamin D3" },
      { name: "Blood pressure tablet", detail: "Amlodipine 5 mg · with breakfast" },
    ],
    changed: ["Metformin and a statin added", "Goal moved to fasting glucose", "Fifth meal added in the evening"],
    follow: { days: 84, followed: 59, weeks: [0.43, 0.57, 0.71, 0.71, 0.86, 0.71, 0.57, 0.71, 0.86, 0.71, 0.71, 0.86] },
  },
];

export const PLAN_HISTORY = { current: CURRENT, earlier: EARLIER };

export const findPlan = (id?: string): PlanRecord | undefined => [CURRENT, ...EARLIER].find((p) => p.id === id);

/** "2 Sep – 17 Nov", dropping the year when both ends share it. */
export function span(p: PlanRecord): string {
  const strip = (d: string) => d.replace(/ \d{4}$/, "");
  if (!p.to) return `Since ${strip(p.from)}`;
  const sameYear = p.from.slice(-4) === p.to.slice(-4);
  return `${sameYear ? strip(p.from) : p.from} – ${p.to}`;
}

export const share = (p: PlanRecord) => Math.round((p.follow.followed / p.follow.days) * 100);
