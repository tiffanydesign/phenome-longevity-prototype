import "./reports";
import "./games-dark.css";
import "./assistant-dark.css";
import { BookingScreen } from "@/screens/discover/BookingScreen";
import { AssistantScreen } from "@/screens/discover/AssistantScreen";
import { StoreScreen } from "@/screens/store/StoreScreen";
import type { ScreenRoute } from "@/screens/types";
import { HomeScreen } from "./home/HomeScreen";
import { MetricScreen } from "./metric/MetricScreen";
import { OmicsScreen } from "./omics/OmicsScreen";
import { DevicesScreen, HomeDevicesScreen } from "./devices/DevicesScreen";
import { DeviceScreen } from "./devices/DeviceScreen";
import { WorkoutScreen } from "./metric/WorkoutScreen";
import { AddDevice } from "./devices/AddDevice";
import { NotificationsScreen } from "./notify/NotificationsScreen";
import { VisitsScreen } from "./visits/VisitsScreen";
import { ProfileScreen } from "./profile/ProfileScreen";
import { PersonalDetails } from "./profile/PersonalDetails";
import { ActivatePage, AddressPage, HealthHistoryPage, LifestylePage, OrdersPage, PasswordPage, TestsPage } from "./profile/records";
import { AppearancePage, FaqsPage, LanguagePage, PrivacyPage } from "./profile/settings";
import { StudyScreen } from "./study/StudyScreen";
import { TwinScreen } from "./twin/TwinScreen";
import { ConsultScreen } from "./consult/ConsultScreen";
import { ConsultationsScreen } from "./consult/ConsultationsScreen";
import { HabitsScreen } from "./habits/HabitsScreen";
import { KitCompareScreen } from "./kits/KitCompareScreen";
import { FoodScreen } from "./food/FoodScreen";
import { ScanScreen } from "./food/ScanScreen";
import { MealScreen } from "./food/MealScreen";
import { AddFood } from "./food/AddFood";
import { SavedScreen } from "./food/SavedScreen";
import { ActivityLog } from "./activity/ActivityLog";
import { SportPick } from "./activity/SportPick";

const group = "Clinical edition";

export const routes: ScreenRoute[] = [
  { path: "/v3/home", element: <HomeScreen />, title: "Home", group },
  { path: "/v3/twin", element: <TwinScreen />, title: "Digital Twin", group },
  { path: "/v3/study/:code", element: <StudyScreen />, title: "Twin review", group },
  { path: "/v3/omics", element: <OmicsScreen />, title: "Omics", group },
  { path: "/v3/insights", element: <OmicsScreen />, title: "Insights (now Omics)", group },
  { path: "/v3/visits", element: <VisitsScreen />, title: "Clinic visits", group },
  { path: "/v3/notifications", element: <NotificationsScreen />, title: "Notifications", group },
  { path: "/v3/devices", element: <DevicesScreen />, title: "Devices", group },
  { path: "/v3/devices/home", element: <HomeDevicesScreen />, title: "Home devices", group },
  { path: "/v3/devices/:id", element: <DeviceScreen />, title: "Device", group },
  { path: "/v3/metric/:id", element: <MetricScreen />, title: "Metric detail", group },
  { path: "/v3/workout/:id", element: <WorkoutScreen />, title: "Workout", group },
  { path: "/v3/food", element: <FoodScreen />, title: "Nutrition", group },
  { path: "/v3/food/scan", element: <ScanScreen />, title: "Scan a meal", group },
  { path: "/v3/food/meal/:id", element: <MealScreen />, title: "Meal", group },
  { path: "/v3/food/add", element: <AddFood />, title: "Add food", group },
  { path: "/v3/food/saved", element: <SavedScreen />, title: "Saved meals", group },
  { path: "/v3/profile", element: <ProfileScreen />, title: "Profile", group },
  { path: "/v3/profile/details", element: <PersonalDetails />, title: "Personal details", group },
  { path: "/v3/profile/health-history", element: <HealthHistoryPage />, title: "Health history", group },
  { path: "/v3/profile/lifestyle", element: <LifestylePage />, title: "Lifestyle", group },
  { path: "/v3/profile/address", element: <AddressPage />, title: "Address", group },
  { path: "/v3/profile/orders", element: <OrdersPage />, title: "Orders", group },
  { path: "/v3/profile/tests", element: <TestsPage />, title: "Activated tests", group },
  { path: "/v3/profile/activate", element: <ActivatePage />, title: "Activate a test", group },
  { path: "/v3/profile/password", element: <PasswordPage />, title: "Change password", group },
  { path: "/v3/profile/appearance", element: <AppearancePage />, title: "Appearance", group },
  { path: "/v3/profile/language", element: <LanguagePage />, title: "Language", group },
  { path: "/v3/profile/faqs", element: <FaqsPage />, title: "FAQs", group },
  { path: "/v3/profile/privacy", element: <PrivacyPage />, title: "Privacy", group },
  { path: "/v3/add-device", element: <AddDevice />, title: "Add device", group },
  { path: "/v3/assistant", element: <AssistantScreen />, title: "Longevity AI", group },
  { path: "/v3/store", element: <StoreScreen />, title: "Store", group },
  { path: "/v3/habits", element: <HabitsScreen />, title: "Habits", group },
  { path: "/v3/consultations", element: <ConsultationsScreen />, title: "Consultations", group },
  // the shared address opens the same list in this edition
  { path: "/discover/consultations", element: <ConsultationsScreen />, title: "Consultations (shared address)", group },
  // the shared journal addresses open the clinical-edition activity pages here
  { path: "/journal/activity", element: <ActivityLog />, title: "Activity log (shared address)", group },
  { path: "/journal/activity/select", element: <SportPick />, title: "Log an activity (shared address)", group },
  { path: "/v3/consultation", element: <ConsultScreen />, title: "Upcoming consultation", group },
  { path: "/v3/kit/:kind/compare", element: <KitCompareScreen />, title: "Compare kit results", group },
  { path: "/v3/booking", element: <BookingScreen />, title: "Book a visit", group },
];
