import type { DataPair } from "@/lib/data";

/* ------------------------------------------------------------------ consultations */

export interface Consultation {
  id: string;
  type: string;
  clinic: string;
  when: string;
}

export const consultationsData: DataPair<Consultation[]> = {
  real: [], // capture consultations/top: "You don't have any upcoming consultations."
  // DEMO
  demo: [{ id: "c1", type: "Video consultation", clinic: "Phenome Stockholm Clinic", when: "Thu, 29 Oct 2026 · 08:00–08:30" }],
};

export type ConsultTypeId = "journey" | "video" | "inperson";
export const CONSULT_TYPES: { id: ConsultTypeId; label: string }[] = [
  { id: "journey", label: "Clinic journey" },
  { id: "video", label: "Video consultation" },
  { id: "inperson", label: "In-person consultation" },
];

export interface Clinic {
  id: string;
  name: string;
  address: string;
  /** Invented round distances — the captured km values reveal the device location (BUILD_GUIDE). */
  km: string;
}

export const CLINICS: Clinic[] = [
  { id: "sto", name: "Phenome Stockholm Clinic", address: "Birger Jarlsgatan, Stockholm, Sweden", km: "60 km" },
  { id: "lon", name: "Phenome Longevity - London", address: "Harley St, London, UK", km: "1400 km" },
  {
    id: "zorlu",
    name: "Phenome Clinic - Zorlu Istanbul",
    address: "Zorlu Center - Shopping Mall, Levazım, Koru Sk. Zorlu Center no : 2, 34340 Beşiktaş/İstanbul, Türkiye",
    km: "2200 km",
  },
  { id: "ifm", name: "Phenome Clinic - IFM Istanbul", address: "Finanskent, Finans Cd, 34760 Ümraniye/İstanbul, Türkiye", km: "2200 km" },
  { id: "ist3", name: "IST-3", address: "İstanbul Cd., Karatay/Konya, Türkiye", km: "2600 km" },
  { id: "5th", name: "Phenome Longevity - 5th Avenue", address: "5th Ave, New York, NY, USA", km: "6300 km" },
  { id: "8th", name: "Phenome Clinic 8th", address: "8th Ave, New York, NY, USA", km: "6300 km" },
  { id: "tokyo", name: "Tokyo Clinic", address: "Tokyo Expressway KK Rte, Chuo City, Tokyo, Japan", km: "8200 km" },
  {
    id: "bkk",
    name: "Bangkok",
    address: "88 Thanon Ratchadaphisek, Khwaeng Khlong Toei, Khet Khlong Toei, Krung Thep Maha Nakhon 10110, Thailand",
    km: "8300 km",
  },
];

export const DURATIONS = [15, 30, 45, 60] as const;
export const PRICE = "0.00 SEK";
export const TIMEZONE = "Europe/Stockholm";
/** Bookable window per day (Europe/Stockholm), 15-min step — capture booking/datetime + slot_selected. */
export const SLOT_OPEN = 8 * 60;
export const SLOT_CLOSE = 21 * 60;

/* ------------------------------------------------------------------ games */

export interface Game {
  id: string;
  /** bold first word + regular rest (capture games/top: "**Slice** Master") */
  bold: string;
  rest: string;
  desc: string;
}

export const GAMES: Game[] = [
  { id: "slice-master", bold: "Slice", rest: " Master", desc: "Swipe to slice flying fruits! Avoid bombs and build combos." },
  { id: "stack-tower", bold: "Stack", rest: " Tower", desc: "Stack blocks perfectly to build the tallest tower. Precision is key!" },
  { id: "bubble-pop", bold: "Bubble", rest: " Pop", desc: "Pop rising bubbles before they escape! Frenzy mode and power-ups!" },
  { id: "flappy-bounce", bold: "Flappy", rest: " Bounce", desc: "Tap to fly through pipes! Classic addictive gameplay." },
  { id: "color-switch", bold: "Color", rest: " Switch", desc: "Match colors to pass through obstacles! Timing is everything." },
  { id: "ball-sort", bold: "Ball", rest: " Sort", desc: "Sort colored balls into tubes! Relaxing puzzle fun." },
  { id: "2048", bold: "2048", rest: "", desc: "Swipe to merge tiles! Can you reach 2048?" },
  { id: "memory-match", bold: "Memory", rest: " Match", desc: "Flip cards and find matching pairs! Train your memory." },
  { id: "shape-fit", bold: "Shape", rest: " Fit", desc: "Drag pieces to fill the shape! A classic puzzle challenge." },
  { id: "tetris", bold: "Tetris", rest: "", desc: "Stack falling blocks and clear lines! A timeless test of speed and planning." },
];

export interface ScoreRow {
  rank: number;
  initials: string;
  score: number;
}

/** Global leaderboard for 2048 — capture game_2048/leaderboard (initials only, no PII). */
export const LEADERBOARD: ScoreRow[] = [
  { rank: 1, initials: "IK", score: 6744 },
  { rank: 2, initials: "MG", score: 4984 },
  { rank: 3, initials: "YA", score: 4856 },
  { rank: 4, initials: "CT", score: 4724 },
  { rank: 5, initials: "EK", score: 4608 },
  { rank: 6, initials: "FY", score: 4220 },
];

export const myScoresData: DataPair<ScoreRow[]> = {
  real: [], // "No scores yet"
  // DEMO
  demo: [
    { rank: 1, initials: "TI", score: 2310 },
    { rank: 2, initials: "TI", score: 1184 },
  ],
};
