import type { ScreenRoute } from "../types";
import { ProfileTab } from "./ProfileTab";
import { HealthHistoryScreen, PersonalDetailsScreen, SavedAddressScreen } from "./DetailScreens";
import { LifestyleScreen } from "./LifestyleScreen";
import { ActivateTestScreen, ChangePasswordScreen, OrdersScreen, PastTestsScreen } from "./FormScreens";
import { AppearanceScreen, FaqsScreen, LanguageScreen } from "./SettingsScreens";
import { PrivacyScreen } from "./PrivacySheet";

const G = "Profile";

export const routes: ScreenRoute[] = [
  { path: "/profile", element: <ProfileTab />, title: "Profile (My Account)", group: G },
  { path: "/profile/details", element: <PersonalDetailsScreen />, title: "Personal Details", group: G },
  { path: "/profile/health-history", element: <HealthHistoryScreen />, title: "Health History", group: G },
  { path: "/profile/lifestyle", element: <LifestyleScreen />, title: "Lifestyle Habits", group: G },
  { path: "/profile/orders", element: <OrdersScreen />, title: "Order History", group: G },
  { path: "/profile/past-tests", element: <PastTestsScreen />, title: "Past Activated Tests", group: G },
  { path: "/profile/activate", element: <ActivateTestScreen />, title: "Activate Test", group: G },
  { path: "/profile/password", element: <ChangePasswordScreen />, title: "Change Password", group: G },
  { path: "/profile/address", element: <SavedAddressScreen />, title: "Saved Address", group: G },
  { path: "/profile/faqs", element: <FaqsScreen />, title: "FAQs", group: G },
  { path: "/profile/privacy", element: <PrivacyScreen />, title: "Privacy Policy (sheet)", group: G },
  { path: "/profile/appearance", element: <AppearanceScreen />, title: "Appearance", group: G },
  { path: "/profile/language", element: <LanguageScreen />, title: "Language", group: G },
];
