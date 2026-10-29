import type { ScreenRoute } from "../types";
import { ActivityList } from "./activity/ActivityList";
import { ActivitySelect } from "./activity/ActivitySelect";
import { ActivityForm } from "./activity/ActivityForm";
import { ActivityDetail } from "./activity/ActivityDetail";
import { DietScreen } from "./diet/DietScreen";
import { MealSummary } from "./diet/MealSummary";
import { MealLog } from "./diet/MealLog";
import { MealCamera } from "./diet/MealCamera";
import { HabitsScreen } from "./habits/HabitsScreen";
import { HabitDetail } from "./habits/HabitDetail";
import { AddHabit } from "./habits/AddHabit";

const G = "Journal";

export const routes: ScreenRoute[] = [
  { path: "/journal/activity", element: <ActivityList />, title: "Activity", group: G },
  { path: "/journal/activity/select", element: <ActivitySelect />, title: "Select Activity", group: G },
  { path: "/journal/activity/form/:type", element: <ActivityForm />, title: "Activity form (running)", group: G },
  { path: "/journal/activity/entry/:id", element: <ActivityDetail />, title: "Activity detail", group: G },
  { path: "/journal/diet", element: <DietScreen />, title: "Diet Tracker", group: G },
  { path: "/journal/diet/meal/:meal", element: <MealSummary />, title: "Meal summary (breakfast)", group: G },
  { path: "/journal/diet/add/:meal", element: <MealLog />, title: "Add Breakfast", group: G },
  { path: "/journal/diet/camera", element: <MealCamera />, title: "Meal camera", group: G },
  { path: "/journal/habits", element: <HabitsScreen />, title: "Habits", group: G },
  { path: "/journal/habits/new", element: <AddHabit />, title: "Add Habits", group: G },
  { path: "/journal/habits/:id", element: <HabitDetail />, title: "Habit detail", group: G },
];
