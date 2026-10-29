import type { DataPair } from "@/lib/data";

export interface MonitorMetric {
  id: string;
  label: string;
  icon: string; // public/assets/icons/<icon>.svg
  value: string;
  unit?: string;
  goal?: string;
}

export interface HomeData {
  sleepHours: number;
  sleepGoal: number;
  calories: number;
  caloriesGoal: number;
  steps: number;
  stepsGoal: number;
  capacity: number;
  /** after any journal activity the Diet / Habits cards turn into progress cards (home/journal_with_data) */
  journal: { dietKcal: number; dietGoal: number; habitsPct: number } | null;
  monitor: MonitorMetric[];
}

const MONITOR_REAL: MonitorMetric[] = [
  { id: "steps", label: "Step Count", icon: "Step_Count", value: "0", goal: "8,000" },
  { id: "calories", label: "Calories", icon: "Calories", value: "0", unit: " kcal", goal: "200 kcal" },
  { id: "distance", label: "Step Distance", icon: "Step_Distance", value: "0.00", unit: " km", goal: "5.00 km" },
  { id: "respiratory", label: "Respiratory Rate", icon: "Respiratory_rate", value: "--", unit: " Breaths/Min" },
  { id: "spo2", label: "Blood Oxygen (SpO₂)", icon: "Blood_Oxygen", value: "--%" },
  { id: "bp", label: "Blood Pressure", icon: "Blood_Pressure", value: "-- / --", unit: " mmHg" },
  { id: "rhr", label: "Resting Heart Rate", icon: "Resting_HeartRate", value: "--", unit: " BPM" },
  { id: "hr", label: "Heart Rate", icon: "HeartRate", value: "--", unit: " BPM" },
  { id: "hrv", label: "Heart Rate Variability", icon: "hrv", value: "--", unit: " ms" },
  { id: "sleep", label: "Hours of Sleep", icon: "HoursOfSleep", value: "--", goal: "7:00" },
];

// DEMO — populated values for design exploration (not from the device).
const MONITOR_DEMO: MonitorMetric[] = [
  { id: "steps", label: "Step Count", icon: "Step_Count", value: "6,482", goal: "8,000" },
  { id: "calories", label: "Calories", icon: "Calories", value: "164", unit: " kcal", goal: "200 kcal" },
  { id: "distance", label: "Step Distance", icon: "Step_Distance", value: "4.12", unit: " km", goal: "5.00 km" },
  { id: "respiratory", label: "Respiratory Rate", icon: "Respiratory_rate", value: "14", unit: " Breaths/Min" },
  { id: "spo2", label: "Blood Oxygen (SpO₂)", icon: "Blood_Oxygen", value: "97%" },
  { id: "bp", label: "Blood Pressure", icon: "Blood_Pressure", value: "118 / 76", unit: " mmHg" },
  { id: "rhr", label: "Resting Heart Rate", icon: "Resting_HeartRate", value: "58", unit: " BPM" },
  { id: "hr", label: "Heart Rate", icon: "HeartRate", value: "72", unit: " BPM" },
  { id: "hrv", label: "Heart Rate Variability", icon: "hrv", value: "48", unit: " ms" },
  { id: "sleep", label: "Hours of Sleep", icon: "HoursOfSleep", value: "7:24", goal: "7:00" },
];

export const homeData: DataPair<HomeData> = {
  real: {
    sleepHours: 0,
    sleepGoal: 8,
    calories: 0,
    caloriesGoal: 200,
    steps: 0,
    stepsGoal: 8000,
    capacity: 0,
    journal: null,
    monitor: MONITOR_REAL,
  },
  demo: {
    sleepHours: 7.4,
    sleepGoal: 8,
    calories: 164,
    caloriesGoal: 200,
    steps: 6482,
    stepsGoal: 8000,
    capacity: 72,
    journal: { dietKcal: 1240, dietGoal: 2000, habitsPct: 50 },
    monitor: MONITOR_DEMO,
  },
};
