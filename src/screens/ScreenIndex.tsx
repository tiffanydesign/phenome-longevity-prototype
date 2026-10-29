import { Link } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { SCREENS } from "./registry";

/** Prototype-only index of every route (not in the original app). */
export function ScreenIndex() {
  const groups = [...new Set(SCREENS.map((s) => s.group))];
  return (
    <Screen header={<NavHeader variant="arrow" title="All screens" />}>
      <div style={{ padding: "8px 20px 40px" }}>
        {groups.map((g) => (
          <section key={g} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, color: "var(--c-text-3)", textTransform: "none", margin: "12px 0 6px" }}>{g}</h2>
            {SCREENS.filter((s) => s.group === g && !s.path.includes(":")).map((s) => (
              <Link
                key={s.path}
                to={s.path}
                style={{ display: "block", padding: "10px 0", borderBottom: "1px solid var(--c-divider)", color: "var(--c-text)", textDecoration: "none", fontSize: 15 }}
              >
                {s.title}
                <span style={{ float: "right", color: "var(--c-text-3)", fontSize: 12 }}>{s.path}</span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </Screen>
  );
}
