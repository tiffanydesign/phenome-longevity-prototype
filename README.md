# Phenome Longevity — web prototype

A pixel-faithful, mobile-sized web replica of the **Phenome Longevity** Android app (v5.6, Flutter),
rebuilt from device captures for design exploration. It restores the app as it is — quirks included —
so that design changes can be made on a faithful baseline.

**Live:** https://tiffanydesign.github.io/phenome-longevity-prototype/

- Desktop: the app renders inside a 394 × 853 phone frame with a prototype panel (theme, data, network, screen index).
- Phone: full-screen, with safe-area insets.
- `#/__screens` lists every route.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/phenome-longevity-prototype/
npm run build    # type-check + production build into dist/
npm run deploy   # build and publish dist/ to the gh-pages branch (GitHub Pages)
```

## Project structure

```
src/
  styles/tokens.css     ← design tokens (colour, type, spacing, radii, shadows, motion; light + dark)
  styles/fonts.css      ← Helvetica Neue @font-face (swap for an Adobe Fonts kit here)
  components/           ← shared building blocks: Screen, NavHeader, TabBar, Overlay (Sheet/Modal),
                          Controls, Charts, Icon, PhoneFrame (status bar + gesture handle), DevPanel
  lib/                  ← asset(), prototype prefs (theme/data/network), data helpers
  data/<module>.ts      ← mock data as { real, demo } pairs
  screens/<module>/     ← screens per module; each index.tsx exports its routes
public/assets/          ← fonts, icons and images extracted from the APK + photos cropped from captures
capture/                ← raw design facts from the device (see below) — not part of the build
tests/                  ← screenshot comparison tooling
docs/BUILD_GUIDE.md     ← conventions and the fidelity workflow
```

Modules: `home` (Home, Capacity, Health Monitor, Add Device) · `journal` (Activity, Diet, Habits) ·
`discover` (Consultations/booking, Games, Longevity AI) · `insights` (tab, reports, Clinical, test kits) ·
`reports` (genetic / gut / transcriptome reports) · `store` (shop, product, cart, checkout) ·
`profile` (account and settings) · `auth` (launch, welcome, login, sign-up).

## Prototype switches

Available in the desktop panel or as hash query parameters (e.g. `#/home?theme=dark&data=demo`):

| switch | values | meaning |
|---|---|---|
| `theme` | `light` / `dark` | Profile → Appearance |
| `data` | `real` / `demo` | `real` = the captured (mostly empty) test account; `demo` = populated mock data |
| `net` | `online` / `offline` | renders the captured offline / error states |

## Capture (design facts)

`capture/` holds what the prototype was built from:

- `screens/<screen>/<state>.png|.xml` — 1280 × 2772 screenshots and UI hierarchy dumps (÷ 3.25 = CSS px)
- `recordings/*.mp4` — transitions and key motion
- `progress.json` / `PROGRESS.md` — every state with navigation edge (`from` / `via`), notes, skipped items + reasons
- `apk_assets/` — fonts, icons, images and the Lottie globe extracted from the APK
- `tools/` — the resumable adb capture tool (`cap.py`) and `sanitize.py`

## Fidelity check

```bash
npm run dev                       # in one terminal
node tests/compare.mjs [module]   # screenshots each case at device geometry and scores it vs. the capture
```

Cases live in `tests/compare/<module>.json`; side-by-side images are written to `tests/out/side/`.

## Data & privacy

The captures come from the owner's test account. Before publishing:
- the account e-mail was replaced (`tiffany@example.com`) in text and painted out of screenshots;
- the internal API host in an offline error was replaced with `api.example.com`;
- excluded entirely (see `.gitignore`): PDF report pages (a person's name / date of birth),
  the in-app camera viewfinder (live room feed), and booking states that reveal the device location.

## Redesign (`#/v2/home`)

A redesign of the app around the digital twin lives beside the replica, under `src/v2/`. The replica's routes are untouched.

- **Structure:** icon tabs and swipeable pages on Home, a floating pill with a round AI button at the bottom, profile top right, cards that can be dragged and resized (long-press, or the ⋮ menu).
- **Navigation:** Home, Twin, Omics. Vitals, Body and Food are Home tabs because they change daily. Omics changes between scans, so it has its own destination. Store moved to a Home card.
- **Twin:** one figure with three lenses (Vitals, Body, Omics), the same three categories the data is filed under. Entry points: the Twin tab, the Home tile, "See it on your twin" on every metric, and Omics.
- **Data link:** `src/v2/data/metrics.ts` is one table in which every number names its organ, source and status. Cards, charts and body regions all read from it.
- **Figure:** `scripts/bake-twin.mjs` runs the Digital Twin's tone pass and halftone numbers over the GLB models and writes one pixel per dot to `public/assets/twin/`. The app draws those dots on a canvas, so data can move them. Rerun it only if a model changes (it needs a `phenome-digital-twin` checkout).

- **Full review** (`#/v2/study/apose`): the clinic portal's 19-study presentation for a phone. Open it from "Full review" on the Twin tab, an organ's panel, or Omics. Figure on top, panel as a sheet, swipe or use the bottom bar to move between studies, Visit 1 to 4 steps through records. Reading rules follow the portal's `clinic-room-display.js`.
- **Review data and films:** `src/v2/study/member.json` is the portal's synthetic test member with names, ids and contact details removed. `public/assets/twin/study/` holds recordings of the room display's own camera flights, taken at double width and cropped to the subject, so the phone runs no WebGL scene.

Twin, Home and Omics use demo data; the Full review uses the synthetic test member, so the two do not match yet. Light theme only for now.
