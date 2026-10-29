# Build guide — Phenome Longevity web prototype

Pixel-faithful web replica of the Phenome Longevity Android app (Flutter, v5.6),
built from device captures. **Restore, don't redesign**: match the screenshots; if
something is unclear, implement your best reading and leave a `// TODO(fidelity): …`
comment explaining what is uncertain.

## Stack & layout

- Vite 6 + React 18 + TypeScript, plain CSS files next to components (no CSS-in-JS, no Tailwind).
- `HashRouter`; deploy base `/phenome-longevity-prototype/` (see `vite.config.ts`).
- Viewport baseline **394 × 853 CSS px** (device 1280 × 2772 @ 3.25 DPR).
  Convert capture pixels → CSS px by **÷ 3.25**.

```
src/
  styles/tokens.css      design tokens (light + dark) — the only place for raw colours/sizes
  components/            shared building blocks (Screen, NavHeader, TabBar, Overlay, Controls, Charts, Icon)
  lib/                   asset(), prefs (theme/data/network), data helpers (useDataset, createStore)
  data/<module>.ts       mock data: { real, demo } pairs
  screens/<module>/      screens + module-local components; index.tsx exports `routes`
capture/                 READ-ONLY device captures (screens/<screen>/<state>.png|.xml, progress.json)
tests/                   compare tooling (Playwright + Python)
```

## Shared building blocks (read the source before use)

| Component | Use |
|---|---|
| `Screen` | every screen. Props: `header`, `tabs` (tab roots), `footer`, `statusTone` ("light" = white status icons), `overlay` |
| `NavHeader` | `variant="chevron"` (‹ centred title: Capacity, Diet Tracker…), `"arrow"` (← Reports, Order History…; `align="left"` for Reports), `"greeting"` (report hubs with `eyebrow` + `right`) |
| `Sheet`, `Modal` | bottom sheet / centred dialog (scrim + 330 ms scale-in) |
| `Button` | tones `navy` `black` `outline` `soft` `disabled` |
| `Segmented`, `TextField`, `Stepper`, `PlusCircle` | controls |
| `Ring`, `Gauge`, `Spinner`, `Skeleton` | charts & loading |
| `Icon name="Step_Count"` | monochrome SVGs from the APK in `public/assets/icons/` (coloured by `currentColor`) |

Images: `asset("img/…")`, `asset("img/rings/…")`, `asset("lottie/globe.json")`.
Network-loaded pictures (product photos, test-kit boxes) are **not** in the APK — crop them
from the captures into `public/assets/photos/<module>/` (PIL, 1:1 device pixels, PNG/JPG).

## Data

Each module owns `src/data/<module>.ts` exporting `DataPair`s:
- `real` = exactly what the capture shows (the test account is mostly empty: 0, `--`, "No …").
- `demo` = plausible populated data for design work; mark it with `// DEMO`.
Screens read data via `useDataset(pair)`; offline states via `useOffline()` (renders the captured
`offline/*` state for that screen when `network=offline`). Interactions that should persist across
navigation (cart, logged meals…) use `createStore()` from `lib/data.ts`.

### Sensitive data — never put these in code or assets
- the account e-mail → use `tiffany@example.com`
- PDF patient details (name, DOB, patient no.) → don't reproduce; render a generic cover
- the internal API host (shown in the offline error) → use `api.example.com`
- clinic distances (reveal device location) → invent round numbers
- camera viewfinder (`meal_camera/top`) → dark placeholder, never the capture

## Fidelity workflow (per screen)

1. Open the capture PNG(s) and read the XML (`capture/screens/<screen>/<state>.xml`):
   `bounds="[x1,y1][x2,y2]"` → divide by 3.25 for CSS px. `progress.json` lists every state with
   `from` / `via` (navigation edges), `note`, and `shot_only` (regions without XML → reproduce visually).
2. Font sizes: `node tests/calibrate.mjs <ref> "<single-line label>" …` prints the CSS size + weight
   derived from ink width. Rule of thumb when you can't calibrate: XML text-box height ÷ 3.25 ÷ 1.45.
3. Scroll states: `python -I tests/scroll_offset.py <screen>` gives the CSS scroll offset of each `scroll_N`.
4. Add cases to `tests/compare/<your-module>.json` and run `node tests/compare.mjs <your-module>`
   (dev server must be up at http://localhost:5173/phenome-longevity-prototype/).
   Read `tests/out/side/<case>.png` (capture | prototype | diff). Iterate until the side-by-side
   looks the same; score < 12 is the target, < 20 acceptable for chart/photo-heavy screens.
5. Recordings in `capture/recordings/*.mp4` define motion (transitions, modals, typing dots, scanning pulse).

Status bar: Home, Capacity and Habit detail use `statusTone="light"` (white icons on white — an app
quirk we reproduce). Everything else default.

## Conventions

- Files 200–400 lines; split screens into module-local components when bigger.
- Colours/sizes from tokens (`var(--…)`); a value used once and measured from a capture may be literal
  with a comment citing the capture (`/* capture: cart/top */`).
- Every screen component has a one-line doc comment naming its capture ids.
- No new dependencies. No edits outside your ownership list (below) — if a shared component needs
  a change, build a module-local variant and mention it in your report.
- Reproduce app bugs faithfully and comment them (e.g. `signin.heading` raw i18n key,
  mojibake "individualÕs", raw exception text when offline).

## Ownership (parallel work)

Each module edits only: `src/screens/<module>/**`, `src/data/<module>.ts` (+ extra data files prefixed
with the module name), `public/assets/photos/<module>/**`, `tests/compare/<module>.json`.
- CSS comments: never write a glob like `product_*/*.xml` inside `/* … */` — `*/` closes the comment early.
