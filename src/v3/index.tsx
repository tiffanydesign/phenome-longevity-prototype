import "./ui/scrollReveal";
import "./reports";
import { BookingScreen } from "@/screens/discover/BookingScreen";
import { AssistantScreen } from "@/screens/discover/AssistantScreen";
import { StoreScreen } from "@/screens/store/StoreScreen";
import type { ScreenRoute } from "@/screens/types";
import { HomeScreen } from "./home/HomeScreen";
import { MetricScreen } from "./metric/MetricScreen";
import { OmicsScreen } from "./omics/OmicsScreen";
import { AddDeviceScreen } from "@/screens/home/device/AddDeviceScreen";
import { DevicesScreen } from "./devices/DevicesScreen";
import { NotificationsScreen } from "./notify/NotificationsScreen";
import { VisitsScreen } from "./visits/VisitsScreen";
import { ProfileScreen } from "./profile/ProfileScreen";
import { StudyScreen } from "./study/StudyScreen";
import { TwinScreen } from "./twin/TwinScreen";
import { ConsultScreen } from "./consult/ConsultScreen";
import { ConsultationsScreen } from "./consult/ConsultationsScreen";
import { HabitsScreen } from "./habits/HabitsScreen";
import { KitCompareScreen } from "./kits/KitCompareScreen";

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
  { path: "/v3/metric/:id", element: <MetricScreen />, title: "Metric detail", group },
  { path: "/v3/profile", element: <ProfileScreen />, title: "Profile", group },
  { path: "/v3/add-device", element: <AddDeviceScreen />, title: "Add device", group },
  { path: "/v3/assistant", element: <AssistantScreen />, title: "Longevity AI", group },
  { path: "/v3/store", element: <StoreScreen />, title: "Store", group },
  { path: "/v3/habits", element: <HabitsScreen />, title: "Habits", group },
  { path: "/v3/consultations", element: <ConsultationsScreen />, title: "Consultations", group },
  // the shared address opens the same list in this edition
  { path: "/discover/consultations", element: <ConsultationsScreen />, title: "Consultations (shared address)", group },
  { path: "/v3/consultation", element: <ConsultScreen />, title: "Upcoming consultation", group },
  { path: "/v3/kit/:kind/compare", element: <KitCompareScreen />, title: "Compare kit results", group },
  { path: "/v3/booking", element: <BookingScreen />, title: "Book a visit", group },
];
