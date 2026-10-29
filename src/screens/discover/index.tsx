import type { ScreenRoute } from "../types";
import { ConsultationsScreen } from "./ConsultationsScreen";
import { BookingScreen } from "./BookingScreen";
import { GamesScreen } from "./GamesScreen";
import { GamePlayScreen } from "./GamePlayScreen";
import { AssistantScreen } from "./AssistantScreen";

const group = "Discover";

export const routes: ScreenRoute[] = [
  { path: "/discover/consultations", element: <ConsultationsScreen />, title: "Your Consultations", group },
  { path: "/discover/booking", element: <BookingScreen />, title: "Book Consultation", group },
  { path: "/discover/games", element: <GamesScreen />, title: "Cognitive Games", group },
  { path: "/discover/games/:id", element: <GamesScreen />, title: "Game launch sheet", group },
  { path: "/discover/games/:id/play", element: <GamePlayScreen />, title: "Game (playing)", group },
  { path: "/assistant", element: <AssistantScreen />, title: "Longevity AI", group },
];
