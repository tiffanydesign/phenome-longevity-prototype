import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PrefsProvider } from "@/lib/prefs";
import { SCREENS } from "@/screens/registry";
import { ScreenIndex } from "@/screens/ScreenIndex";

/** Hash routing so GitHub Pages never 404s on refresh or deep links. */
export function App() {
  return (
    <HashRouter>
      <PrefsProvider>
        <PhoneFrame>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            {SCREENS.map((s) => (
              <Route key={s.path} path={s.path} element={s.element} />
            ))}
            <Route path="/__screens" element={<ScreenIndex />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </PhoneFrame>
      </PrefsProvider>
    </HashRouter>
  );
}
