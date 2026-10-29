import type { ScreenRoute } from "../types";
import { HomeScreen } from "./HomeScreen";
import { CapacityScreen } from "./capacity/CapacityScreen";
import { MonitorScreen } from "./monitor/MonitorScreen";
import { AddDeviceScreen } from "./device/AddDeviceScreen";

export const routes: ScreenRoute[] = [
  { path: "/home", element: <HomeScreen />, title: "Home", group: "Home" },
  { path: "/home/capacity", element: <CapacityScreen />, title: "Capacity", group: "Home" },
  { path: "/home/monitor/:metric", element: <MonitorScreen />, title: "Health Monitor", group: "Home" },
  { path: "/home/add-device", element: <AddDeviceScreen />, title: "Add Device", group: "Home" },
];
