import { BookingScreen } from "@/screens/discover/BookingScreen";
import { AssistantScreen } from "@/screens/discover/AssistantScreen";
import { StoreScreen } from "@/screens/store/StoreScreen";
import type { ScreenRoute } from "@/screens/types";
import { HomeScreen } from "./home/HomeScreen";
import { MetricScreen } from "./metric/MetricScreen";
import { OmicsScreen } from "./omics/OmicsScreen";
import { AddDeviceScreen, ProfileScreen } from "./profile/ProfileScreen";
import { StudyScreen } from "./study/StudyScreen";
import { TwinScreen } from "./twin/TwinScreen";

const group = "Redesign";

export const routes: ScreenRoute[] = [
  { path: "/v2/home", element: <HomeScreen />, title: "Home", group },
  { path: "/v2/twin", element: <TwinScreen />, title: "Digital Twin", group },
  { path: "/v2/study/:code", element: <StudyScreen />, title: "Twin review", group },
  { path: "/v2/omics", element: <OmicsScreen />, title: "Omics", group },
  { path: "/v2/metric/:id", element: <MetricScreen />, title: "Metric detail", group },
  { path: "/v2/profile", element: <ProfileScreen />, title: "Profile", group },
  { path: "/v2/add-device", element: <AddDeviceScreen />, title: "Add device", group },
  { path: "/v2/assistant", element: <AssistantScreen />, title: "Longevity AI", group },
  { path: "/v2/store", element: <StoreScreen />, title: "Store", group },
  { path: "/v2/booking", element: <BookingScreen />, title: "Book a visit", group },
];
