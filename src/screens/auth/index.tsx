import type { ScreenRoute } from "../types";
import { LaunchScreen, LoginScreen, SignupScreen, WelcomeScreen } from "./AuthScreens";

const group = "Auth";

export const routes: ScreenRoute[] = [
  { path: "/launch", element: <LaunchScreen />, title: "Launch (spinner)", group },
  { path: "/welcome", element: <WelcomeScreen />, title: "Welcome", group },
  { path: "/login", element: <LoginScreen />, title: "Log In", group },
  { path: "/signup", element: <SignupScreen />, title: "Sign Up", group },
];
