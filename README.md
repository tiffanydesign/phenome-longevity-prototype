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
