import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { SPORTS } from "@/data/journal";
import { JHeader, SoftKeyboard, suggest } from "../shared/parts";
import { SearchIcon, StarOutline } from "../shared/icons";
import "./activity.css";

/**
 * Sport picker — capture: activity_add/top, activity_add/search ("run").
 * `?q=` pre-fills the search (used by tests/compare for the typed state).
 */
export function ActivitySelect() {
  const [params] = useSearchParams();
  const initial = params.get("q") ?? "";
  return <SelectBody key={initial} initial={initial} />;
}

function SelectBody({ initial }: { initial: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState(initial);
  const [focused, setFocused] = useState(initial !== "");
  const list = SPORTS.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Screen
      header={
        <>
          <JHeader kind="activity" title="Select Activity" />
          <label className="act-search">
            <SearchIcon size={21} />
            <input
              value={q}
              autoFocus={initial !== ""}
              placeholder="Search Activity..."
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </label>
        </>
      }
      overlay={focused ? <SoftKeyboard suggestions={suggest(q)} /> : undefined}
    >
      <div className="act-select">
        <div className="act-sports">
          {list.map((s) => (
            <div key={s.id} className="act-sport" role="button" onClick={() => nav(`/journal/activity/form/${s.id}`, { replace: true })}>
              <Icon name={s.icon} size={23} className="act-sport-icon" />
              <span className="act-sport-name">{s.name}</span>
              {/* TODO(fidelity): favourite toggle never captured in its filled state */}
              <button className="act-star" aria-label="Favourite" onClick={(e) => e.stopPropagation()}>
                <StarOutline size={22} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
