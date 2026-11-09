import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PrefsProvider } from "@/lib/prefs";
import { EDITION, EDITION_HOME } from "@/lib/edition";
import { ROUTES } from "@/screens/registry";
import { ScreenIndex } from "@/screens/ScreenIndex";

/** The captured app's own tab roots: in a redesign they lead back to its home instead. */
const ORIGINAL_ROOTS = ["/home", "/insights", "/store", "/profile", "/assistant"];

/** Hash routing so GitHub Pages never 404s on refresh or deep links. */
export function App() {
  const home = EDITION_HOME[EDITION];
  const redirected = EDITION === "original" ? [] : ORIGINAL_ROOTS;
  return (
    <HashRouter>
      <PrefsProvider>
        <PhoneFrame>
          <Routes>
            <Route path="/" element={<Navigate to={home} replace />} />
            {redirected.map((p) => (
              <Route key={p} path={p} element={<Navigate to={home} replace />} />
            ))}
            {ROUTES.filter((s) => !redirected.includes(s.path)).map((s) => (
              <Route key={s.path} path={s.path} element={s.element} />
            ))}
            <Route path="/__screens" element={<ScreenIndex />} />
            <Route path="*" element={<Navigate to={home} replace />} />
          </Routes>
        </PhoneFrame>
      </PrefsProvider>
    </HashRouter>
  );
}
