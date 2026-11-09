import type { ReactNode } from "react";
import "./art.css";

export type ArtName = "heart" | "moon" | "gauge" | "food" | "wrist" | "steps" | "runner" | "lens" | "flame" | "apple" | "dumbbell" | "bone" | "check" | "cells" | "molecule" | "ripple" | "pulse" | "sugar" | "pin" | "thermo" | "drop" | "helix";

/*
 * Each object is cut from flat paper in three tones and laid in layers: a
 * white body (art-a), the field's hue for its main part (art-b), and a pale
 * tint of that hue for an inner part (art-c). No outlines, no shadows, no
 * motion; form comes from where the tones meet. Small lines, where an object
 * needs one, are in the field's hue.
 */


/*
 * The sleep sky: a seeded scatter, so it reads as random but sits the same on
 * every open. The sky is deepest at the top right, by the moon, and thins out
 * toward the bottom left: stars there are fewer, smaller and fainter. Two
 * glints catch the light where the field is densest.
 */
const STARS: [number, number, number, number][] = (() => {
  let seed = 11;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const out: [number, number, number, number][] = [];
  let tries = 0;
  // the field runs past the art's box across the whole card, which clips it
  while (out.length < 70 && tries++ < 6000) {
    const x = -90 + rnd() * 218;
    const y = -8 + rnd() * 150;
    // 0 at the top right corner, 1 at the bottom left
    const t = Math.min(1, Math.max(0, (128 - x + y + 8) / 366));
    if (rnd() > (1 - t) ** 1.8) continue;
    // keep clear of the cloud, the card's name and its reading
    if (x > 18 && x < 66 && y > 74 && y < 102) continue;
    if (x < -20 && y < 26) continue;
    if (x < 30 && y > 104) continue;
    const near = 1 - t;
    const k = rnd() * (0.35 + near);
    const r = k > 1 ? 1.9 : k > 0.55 ? 1.3 : 0.8;
    out.push([+x.toFixed(1), +y.toFixed(1), r, +(0.1 + near * 0.75 * (0.55 + rnd() * 0.45)).toFixed(2)]);
  }
  return out;
})();
const GLINTS: [number, number, number, number][] = [
  [118, 4, 4.5, 0.85],
  [6, 12, 3.5, 0.55],
  [-38, 46, 2.6, 0.3],
];

function draw(name: ArtName): ReactNode {
  switch (name) {
    case "heart":
      return (
        <>
          <path className="art-a" d="M62 90C32 72 22 56 22 42c0-12 9-21 21-21 8 0 15 4 19 11 4-7 11-11 19-11 12 0 21 9 21 21 0 14-10 30-40 48z" />
          <path className="art-b-line" d="M32 52h14l6-12 9 24 7-14h22" />
        </>
      );
    case "pulse":
      return (
        <>
          <rect className="art-a" x="20" y="24" width="80" height="58" rx="17" />
          <path className="art-b-line" d="M30 54h14l6-13 9 26 7-15h24" />
        </>
      );
    case "moon":
      return (
        <g transform="translate(-8 4)">
          {/* a field of stars, dense by the moon and thinning to the far corner, then the crescent and a cloud */}
          {STARS.map(([x, y, r, o], i) => (
            <circle key={i} className="art-a" cx={x} cy={y} r={r} opacity={o} />
          ))}
          {GLINTS.map(([x, y, r, o]) => (
            <path key={`${x}-${y}`} className="art-a" opacity={o} d={`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`} />
          ))}
          <path className="art-a" d="M70 14a40 40 0 1 0 30 62A34 34 0 0 1 70 14z" />
          <path className="art-b" d="M30 96a8 8 0 0 1 2-15.6 11 11 0 0 1 20.4-2.6 8 8 0 0 1 11.6 7 6 6 0 0 1 0 11.2z" />
        </g>
      );
    case "gauge": {
      // a three-quarter dial: a white track, the reading in the field's hue, and a needle pointing at it
      const r = 34;
      const len = 2 * Math.PI * r * 0.75;
      const at = ((135 + 270 * 0.72) * Math.PI) / 180;
      return (
        <>
          <g transform="rotate(135 62 60)" fill="none" strokeWidth="12" strokeLinecap="round">
            <circle cx="62" cy="60" r={r} stroke="var(--art-a)" strokeDasharray={`${len} 999`} />
            <circle cx="62" cy="60" r={r} stroke="var(--art-b)" strokeDasharray={`${len * 0.72} 999`} />
          </g>
          <path className="art-b-line" strokeWidth="7" d={`M62 60L${(62 + 25 * Math.cos(at)).toFixed(1)} ${(60 + 25 * Math.sin(at)).toFixed(1)}`} />
          <circle className="art-a" cx="62" cy="60" r="9" />
          <circle className="art-b" cx="62" cy="60" r="4" />
        </>
      );
    }
    case "food":
      return (
        <>
          <path className="art-a" d="M60 20c14 0 22 8 30 10 12 3 18 14 16 26-2 11-10 15-12 24-3 12-14 18-28 16-12-2-18 2-30-2-12-4-18-16-14-28 2-8-2-14 2-24 4-12 18-22 36-22z" />
          <circle className="art-b" cx="62" cy="58" r="16" />
        </>
      );
    case "steps": {
      /*
       * A right footprint, toes off: the outer edge runs almost straight, the inner
       * edge cuts deep at the arch, a broad forefoot tilted in and a smaller heel.
       * The asymmetry is what reads as a foot rather than a pin.
       */
      const FOOT = "M-1 -31C9 -32 15 -25 15 -15C15 -7 12 -1 11 6C10 12 11 17 12 22C13 30 8 34 2 34C-5 34 -9 29 -9 23C-9 18 -6 15 -4 12C-2 8 -2 5 -4 2C-7 -2 -14 -6 -14 -16C-14 -25 -9 -31 -1 -31Z";
      return (
        <>
          {/* the step just taken, a left foot fainter and behind; the step being taken, solid and ahead */}
          <g transform="translate(36 80) rotate(-8) scale(-0.9 0.9)">
            <path className="art-a" d={FOOT} opacity="0.55" />
          </g>
          <g transform="translate(70 56) rotate(12) scale(0.9)">
            <path className="art-a" d={FOOT} />
          </g>
        </>
      );
    }
    case "runner":
      return (
        <g transform="translate(-4 8) scale(0.92)">
          {/*
           * A runner mid-stride built from soft, thick forms: a round head, a
           * bean of a body and short rounded limbs that merge into one white
           * shape; the speed behind it in the field's hue.
           */}
          <path className="art-b-line" strokeWidth="6.5" d="M18 50h12M10 63h16M16 76h10" />
          <g fill="none" stroke="var(--art-a)" strokeLinecap="round" strokeLinejoin="round">
            <path strokeWidth="10" d="M69 46Q56 46 50 57" />
            <path strokeWidth="11.5" d="M62 66Q51 81 36 84" />
            <path strokeWidth="11.5" d="M64 66Q85 70 80 93" />
            <path strokeWidth="18" d="M73 42 65 63" />
            <path strokeWidth="10" d="M76 47Q89 55 97 46" />
          </g>
          <circle className="art-a" cx="84" cy="18" r="11" />
        </g>
      );
    case "lens":
      return (
        <>
          {/* a looking glass over the skin: the white rim and handle, the one spot it found in the field's hue */}
          <path className="art-a-line" strokeWidth="13" d="M78 76l22 22" />
          <circle className="art-a" cx="56" cy="52" r="34" />
          <circle className="art-c" cx="56" cy="52" r="24" />
          <circle className="art-b" cx="60" cy="48" r="8" />
        </>
      );
    case "wrist":
      return (
        <>
          {/* a pulse taken at the wrist: a white band, the reading as a round face in the field's hue */}
          <rect className="art-a" x="46" y="12" width="32" height="96" rx="16" />
          <circle className="art-a" cx="62" cy="60" r="27" />
          <circle className="art-b" cx="62" cy="60" r="19" />
          <path className="art-a-line" strokeWidth="4.5" d="M50 61h5l3-6 5 12 3-6h6" />
        </>
      );
    case "flame":
      return (
        <>
          <path className="art-a" d="M64 100c-20 0-32-14-32-29 0-19 17-26 19-49 14 10 23 23 21 37 6-4 9-10 10-17 11 10 15 21 15 30 0 15-12 28-33 28z" />
          <path className="art-b" d="M64 100c-9 0-14-7-14-14 0-10 7-13 11-23 8 7 13 12 15 20 2 10-3 17-12 17z" />
        </>
      );
    case "apple":
      return (
        <>
          <path className="art-a" d="M64 44c-7-6-17-7-24-3-11 6-14 19-11 31 3 13 11 26 22 26 5 0 8-3 13-3s8 3 13 3c11 0 19-13 22-26 3-12 0-25-11-31-7-4-17-3-24 3z" />
          <path className="art-b" d="M68 34c4-12 15-16 25-14-2 12-13 18-25 14z" />
        </>
      );
    case "dumbbell":
      return (
        <g transform="rotate(-24 64 60)">
          <rect className="art-a" x="26" y="55" width="76" height="9" rx="4.5" />
          <rect className="art-b" x="30" y="34" width="15" height="50" rx="6" />
          <rect className="art-b" x="83" y="34" width="15" height="50" rx="6" />
          <rect className="art-a" x="18" y="44" width="11" height="30" rx="4.5" />
          <rect className="art-a" x="99" y="44" width="11" height="30" rx="4.5" />
        </g>
      );
    case "bone":
      return (
        <g transform="rotate(-34 64 58)">
          <path className="art-a" d="M42 50h44a10 10 0 1 1 10 8 10 10 0 1 1-10 8H42a10 10 0 1 1-10-8 10 10 0 1 1 10-8z" />
          <rect className="art-c" x="46" y="56" width="36" height="4" rx="2" />
        </g>
      );
    case "check":
      return (
        <>
          <circle className="art-a" cx="62" cy="54" r="34" />
          <path className="art-b-line" strokeWidth="9" d="M46 55l11 11 21-23" />
        </>
      );
    case "cells":
      return (
        <>
          <circle className="art-a" cx="54" cy="46" r="24" />
          <circle className="art-c" cx="90" cy="68" r="16" />
          <circle className="art-a" cx="56" cy="88" r="11" />
          <circle className="art-b" cx="60" cy="42" r="8" />
          <circle className="art-b" cx="92" cy="65" r="5" />
        </>
      );
    case "molecule":
      return (
        <>
          <path className="art-c-line" d="M42 40l50-6M42 40l22 44M92 34L64 84" />
          <circle className="art-a" cx="42" cy="40" r="13" />
          <circle className="art-b" cx="92" cy="34" r="16" />
          <circle className="art-a" cx="64" cy="84" r="14" />
        </>
      );
    case "ripple":
      return (
        <>
          <path className="art-a-line" d="M40 38c8-8 15-8 22 0s14 8 22 0 14-8 22 0" />
          <path className="art-b-line" d="M40 60c8-8 15-8 22 0s14 8 22 0 14-8 22 0" />
          <path className="art-c-line" d="M40 82c8-8 15-8 22 0s14 8 22 0" />
        </>
      );
    case "sugar":
      return (
        <>
          <path className="art-a" d="M64 22l32 18-32 18-32-18z" />
          <path className="art-b" d="M32 40l32 18v36L32 76z" />
          <path className="art-c" d="M96 40v36L64 94V58z" />
        </>
      );
    case "pin":
      return (
        <>
          <ellipse className="art-c" cx="64" cy="98" rx="18" ry="5" />
          <path className="art-a" d="M64 92S36 67 36 46a28 28 0 0 1 56 0c0 21-28 46-28 46z" />
          <circle className="art-b" cx="64" cy="46" r="11" />
        </>
      );
    case "thermo":
      return (
        <>
          <rect className="art-a" x="54" y="14" width="20" height="64" rx="10" />
          <circle className="art-a" cx="64" cy="84" r="17" />
          <rect className="art-b" x="60" y="40" width="8" height="44" rx="4" />
          <circle className="art-b" cx="64" cy="84" r="10" />
          <rect className="art-c" x="80" y="30" width="9" height="4" rx="2" />
          <rect className="art-c" x="80" y="42" width="9" height="4" rx="2" />
          <rect className="art-c" x="80" y="54" width="9" height="4" rx="2" />
        </>
      );
    case "drop":
      return (
        <>
          <path className="art-a" d="M62 18s28 30 28 50a28 28 0 0 1-56 0c0-20 28-50 28-50z" />
          <path className="art-b-line" d="M48 70a14 14 0 0 0 10 14" />
        </>
      );
    case "helix":
      return (
        <>
          <path className="art-c-line" d="M52 28h24M50 60h28M52 92h24" />
          <path className="art-a-line" d="M46 16c0 22 36 22 36 44S46 82 46 104" />
          <path className="art-b-line" d="M82 16c0 22-36 22-36 44s36 22 36 44" />
        </>
      );
  }
}

/** Each card's mark, a flat paper cut of its object in the field's tones. Sized by CSS. */
export function Art({ name, className }: { name: ArtName; className?: string }) {
  return (
    <svg className={`v2-glyph v2-art ${className ?? ""}`} width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      {draw(name)}
    </svg>
  );
}

/** One object per metric, so the same reading looks the same on every page. */
export const METRIC_ART: Record<string, ArtName> = {
  capacity: "gauge",
  steps: "steps",
  kcal: "flame",
  distance: "ripple",
  workouts: "check",
  sleep: "moon",
  deep: "ripple",
  temp: "thermo",
  rhr: "heart",
  hr: "heart",
  hrv: "pulse",
  crp: "cells",
  bp: "drop",
  spo2: "molecule",
  resp: "ripple",
  weight: "dumbbell",
  bmi: "gauge",
  visceral: "drop",
  bodyfat: "cells",
  pulse: "wrist",
  bone: "bone",
  skin: "lens",
  diet: "food",
  habits: "check",
  diversity: "molecule",
  glucose: "sugar",
  hba1c: "sugar",
  tc: "drop",
  tg: "drop",
  tsh: "molecule",
  egfr: "drop",
};
