import type { DataPair } from "@/lib/data";

/** Placeholder shown by the app for an empty value (capture: profile_account/top "—"). */
export const DASH = "—";

export interface ProfileUser {
  firstName: string;
  lastName: string;
  /** never the captured address — see docs/BUILD_GUIDE.md "Sensitive data" */
  email: string;
  sex: string;
  dob: string;
  weight: string;
  height: string;
}

export interface HealthHistory {
  smoking: string;
  alcohol: string;
  chronic: string;
  medical: string;
  medications: string;
}

export interface Address {
  line1: string;
  town: string;
  city: string;
  postcode: string;
  country: string;
}

export interface Lifestyle {
  activity: string;
  water: string;
  sleep: string;
  goals: string[];
}

export interface Order {
  id: string;
  date: string;
  title: string;
  total: string;
  status: string;
}

export interface ProfileData {
  user: ProfileUser;
  health: HealthHistory;
  address: Address;
  lifestyle: Lifestyle;
  orders: Order[];
  pastTests: { id: string; name: string; date: string }[];
}

const REAL: ProfileData = {
  user: { firstName: "Tiffany", lastName: "Shi", email: "tiffany@example.com", sex: "", dob: "", weight: DASH, height: DASH },
  // Smoking / Alcohol render as empty fields, the rest as "—" (capture: profile_health_history/top)
  health: { smoking: "", alcohol: "", chronic: DASH, medical: DASH, medications: DASH },
  address: { line1: DASH, town: DASH, city: DASH, postcode: DASH, country: DASH },
  lifestyle: { activity: DASH, water: DASH, sleep: DASH, goals: [] },
  orders: [],
  pastTests: [],
};

// DEMO — populated values for design exploration (not from the device).
const DEMO: ProfileData = {
  user: { firstName: "Tiffany", lastName: "Shi", email: "tiffany@example.com", sex: "Female", dob: "12/07/1994", weight: "58 kg", height: "165 cm" },
  health: { smoking: "Never", alcohol: "Occasionally", chronic: "None", medical: "None", medications: "Vitamin D" },
  address: { line1: "1 Example Street", town: "Southwark", city: "London", postcode: "SE1 1AA", country: "United Kingdom" },
  lifestyle: { activity: "30-60 mins", water: "2-3 L", sleep: "7-8h", goals: ["Sleep Better", "Promote Longevity"] },
  orders: [{ id: "PL-10234", date: "12 Oct 2026", title: "Phenome Gut Health Test", total: "£199.00", status: "Delivered" }],
  pastTests: [{ id: "KIT-4821", name: "Gut Microbiome Test", date: "14 Oct 2026" }],
};

export const profileData: DataPair<ProfileData> = { real: REAL, demo: DEMO };

/** Lifestyle edit chip groups (capture: profile_lifestyle/edit). */
export const LIFESTYLE_OPTIONS = {
  activity: ["< 20 mins", "20-30 mins", "30-60 mins", "60+ mins"],
  water: ["< 1 L", "1-2 L", "2-3 L", "3+ L"],
  sleep: ["< 6h", "6-7h", "7-8h", "> 9h"],
  goals: ["Reduce Stress", "Eat Healthier", "Improve Endurance", "Sleep Better", "Balance Hormones", "Promote Longevity"],
} as const;

/** FAQ accordion (capture: profile_faqs/top, expanded). */
export const FAQS: { q: string; a: string }[] = [
  // TODO(fidelity): only the "How long…" answer was captured; the other answers are placeholders.
  { q: "How do I activate my test kit?", a: "Go to Profile → Activate New Test and enter the activation code printed on your kit." },
  { q: "How long does it take to get my results?", a: "Results are typically available within 2-4 weeks after your sample is received at our laboratory." },
  { q: "Can I change my personal information?", a: "Yes. Open Personal Details from your profile and tap the edit icon." },
  { q: "How do I track my order?", a: "Your orders and their status are listed under Order History." },
  { q: "Is my data secure?", a: "Your data is encrypted and handled in line with our Privacy Policy." },
  { q: "How can I contact support?", a: "Ask Longevity AI or email our support team from the app." },
];

/** Password requirements, in capture order (profile_change_password/top). */
export const PASSWORD_RULES: { label: string; test: (s: string) => boolean }[] = [
  { label: "At least 10 characters", test: (s) => s.length >= 10 },
  { label: "An uppercase letter", test: (s) => /[A-Z]/.test(s) },
  { label: "A lowercase letter", test: (s) => /[a-z]/.test(s) },
  { label: "A number", test: (s) => /\d/.test(s) },
  { label: "A symbol, like ! or #", test: (s) => /[^A-Za-z0-9]/.test(s) },
];

/**
 * Language list ("47"). Native · English pairs verbatim from profile_language/top…scroll_4
 * (Amharic → Malay); languages without a native label show only the English name.
 */
export const LANGUAGES: { native?: string; name: string }[] = [
  { native: "አማርኛ", name: "Amharic" },
  { native: "العربية", name: "Arabic" },
  { native: "বাংলা", name: "Bengali" },
  { native: "မြန်မာ", name: "Burmese" },
  { native: "中文", name: "Chinese" },
  { native: "Čeština", name: "Czech" },
  { native: "Dansk", name: "Danish" },
  { native: "Nederlands", name: "Dutch" },
  { name: "English" },
  { name: "Filipino" },
  { native: "Suomi", name: "Finnish" },
  { native: "Français", name: "French" },
  { native: "Deutsch", name: "German" },
  { native: "Ελληνικά", name: "Greek" },
  { native: "ગુજરાતી", name: "Gujarati" },
  { name: "Hausa" },
  { native: "עברית", name: "Hebrew" },
  { native: "हिन्दी", name: "Hindi" },
  { native: "Magyar", name: "Hungarian" },
  { name: "Igbo" },
  { native: "Bahasa Indonesia", name: "Indonesian" },
  { native: "Italiano", name: "Italian" },
  { native: "日本語", name: "Japanese" },
  { native: "ಕನ್ನಡ", name: "Kannada" },
  { native: "한국어", name: "Korean" },
  { native: "Bahasa Melayu", name: "Malay" },
  // TODO(fidelity): rows after Malay were not captured; the remaining 21 are inferred to reach the "47" count.
  { native: "മലയാളം", name: "Malayalam" },
  { native: "मराठी", name: "Marathi" },
  { native: "Norsk", name: "Norwegian" },
  { native: "فارسی", name: "Persian" },
  { native: "Polski", name: "Polish" },
  { native: "Português", name: "Portuguese" },
  { native: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { native: "Română", name: "Romanian" },
  { native: "Русский", name: "Russian" },
  { native: "Español", name: "Spanish" },
  { native: "Kiswahili", name: "Swahili" },
  { native: "Svenska", name: "Swedish" },
  { native: "தமிழ்", name: "Tamil" },
  { native: "తెలుగు", name: "Telugu" },
  { native: "ไทย", name: "Thai" },
  { native: "Türkçe", name: "Turkish" },
  { native: "Українська", name: "Ukrainian" },
  { native: "اردو", name: "Urdu" },
  { native: "Tiếng Việt", name: "Vietnamese" },
  { name: "Yoruba" },
  { name: "Zulu" },
];
