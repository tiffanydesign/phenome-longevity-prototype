import { useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { SPORTS, sportById, type Sport } from "@/data/journal";
import { useActivities } from "@/data/journal-store";
import { Empty, Group, SearchField, SubPage } from "../profile/kit";
import "./activity-log.css";

/*
 * Choosing what to log. Starred sports sit first and recent ones under
 * them, so the usual choice is one tap away; everything else follows A to Z
 * under a letter. Search narrows all of it at once.
 */

const FAV_KEY = "phenome.v3.sports.fav";
const FAV_SEED = ["walking", "strength", "yoga"];

let favs: string[] = (() => {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // storage blocked: fall back to the seed
  }
  return FAV_SEED;
})();
const subs = new Set<() => void>();
function toggleFav(id: string) {
  favs = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch {
    // storage blocked: keep it for this visit only
  }
  subs.forEach((f) => f());
}
function useFavs() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => favs,
  );
}

export function SportPick() {
  const nav = useNavigate();
  const fav = useFavs();
  const logged = useActivities();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const recent = useMemo(() => {
    const seen: string[] = [];
    [...logged].sort((a, b) => b.start - a.start).forEach((a) => !seen.includes(a.sportId) && !fav.includes(a.sportId) && seen.push(a.sportId));
    return seen.slice(0, 3).map(sportById);
  }, [logged, fav]);

  const pick = (s: Sport) => nav(`/journal/activity/form/${s.id}`, { replace: true });
  const row = (s: Sport) => <SportRow key={s.id} s={s} fav={fav.includes(s.id)} onPick={() => pick(s)} />;

  const hits = SPORTS.filter((s) => s.name.toLowerCase().includes(query));
  const letters = useMemo(() => {
    const by = new Map<string, Sport[]>();
    [...SPORTS].sort((a, b) => a.name.localeCompare(b.name)).forEach((s) => {
      const k = s.name[0].toUpperCase();
      by.set(k, [...(by.get(k) ?? []), s]);
    });
    return [...by.entries()];
  }, []);

  return (
    <SubPage title="Log an activity" lead="Pick what you did. Star the ones you do most and they stay at the top.">
      <div className="al-search">
        <SearchField value={q} onChange={setQ} placeholder="Search activities" />
      </div>

      {query ? (
        hits.length ? (
          <Group title={`${hits.length} ${hits.length === 1 ? "match" : "matches"}`}>
            <div className="dv-group al-group">{hits.map(row)}</div>
          </Group>
        ) : (
          <Empty title="No activity by that name" line="Try a shorter word, or pick the closest one from the list." />
        )
      ) : (
        <>
          {fav.length > 0 && (
            <Group title="Starred">
              <div className="dv-group al-group">{fav.map((id) => row(sportById(id)))}</div>
            </Group>
          )}
          {recent.length > 0 && (
            <Group title="Recent">
              <div className="dv-group al-group">{recent.map(row)}</div>
            </Group>
          )}
          <Group title="All activities">
            {letters.map(([k, list]) => (
              <div key={k} className="al-letter">
                <h3>{k}</h3>
                <div className="dv-group al-group">{list.map(row)}</div>
              </div>
            ))}
          </Group>
        </>
      )}
    </SubPage>
  );
}

function SportRow({ s, fav, onPick }: { s: Sport; fav: boolean; onPick: () => void }) {
  return (
    <div className="al-row">
      <button className="al-row-main" onClick={onPick}>
        <span className="al-disc" aria-hidden>
          <Icon name={s.icon} size={22} />
        </span>
        <span className="al-name">{s.name}</span>
      </button>
      <button className="al-star" data-on={fav ? "" : undefined} aria-pressed={fav} aria-label={fav ? `Unstar ${s.name}` : `Star ${s.name}`} onClick={() => toggleFav(s.id)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
          <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
        </svg>
      </button>
    </div>
  );
}
