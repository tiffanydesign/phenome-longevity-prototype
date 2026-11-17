import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { V2Screen } from "../ui/shell";
import { dishOf, fmt, foodOf, MACROS, NUTRIENT, slotAt, slotName, totalsOf } from "./data";
import { food } from "./store";
import { NutrientMark, Ring } from "./parts";
import "./scan.css";

/*
 * The camera as a scene: the table fills the screen, the controls float over
 * it as glass, a band of light passes over the plate, and each food it finds
 * is pinned where it sits with its energy. A card at the foot adds the plate
 * up as the foods appear, so the shutter only confirms what is already read.
 *
 * Barcode and label read a packaged food: the frame changes shape, a laser
 * line sweeps it, and a product card rises with what the code or panel says.
 * Recognition is a demo; "Use camera" swaps the scene for the phone's camera.
 */

type Mode = "meal" | "barcode" | "label";
const DISH = dishOf("egg-plate")!;
const YOGURT_SCENE = `${import.meta.env.BASE_URL}assets/photos/food/scene-yogurt.jpg`;
const PACK = { food: "yogurt-strawberry", grams: 120, code: "5 012345 678900", brand: "Dairy farm" };

const MODES: { id: Mode; name: string; icon: JSX.Element }[] = [
  {
    id: "meal",
    name: "Meal",
    // fork and knife
    icon: (
      <>
        <path d="M4 3v6a2.5 2.5 0 0 0 2.5 2.5h1A2.5 2.5 0 0 0 10 9V3" />
        <path d="M7 3v18" />
        <path d="M19.5 14.5V3c-2.5 0-4.5 2.2-4.5 5v4.5a2 2 0 0 0 2 2h2.5zm0 0V21" />
      </>
    ),
  },
  { id: "barcode", name: "Barcode", icon: <path d="M5 6v12M8 6v12M11 6v12M13.5 6v12M16.5 6v12M19 6v12" /> },
  {
    id: "label",
    name: "Label",
    icon: (
      <>
        <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3.5" />
      </>
    ),
  },
];

/** A frame as a square JPEG small enough to keep on the device. */
function grab(src: CanvasImageSource, w: number, h: number) {
  const s = Math.min(w, h);
  const c = document.createElement("canvas");
  c.width = c.height = 640;
  c.getContext("2d")!.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 640, 640);
  return c.toDataURL("image/jpeg", 0.78);
}

/** How many of the plate's foods have been found so far: one every 520 ms after a short look. */
function useFound(total: number, key: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const timers = Array.from({ length: total }, (_, i) => window.setTimeout(() => setN(i + 1), 700 + i * 520));
    return () => timers.forEach(clearTimeout);
  }, [total, key]);
  return n;
}

/** A packaged food is read once, 1.6 s after the frame settles on it. */
function useRead(key: string) {
  const [read, setRead] = useState(false);
  useEffect(() => {
    setRead(false);
    const t = window.setTimeout(() => setRead(true), 1600);
    return () => clearTimeout(t);
  }, [key]);
  return read;
}

export function ScanScreen() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) || "meal");
  const [live, setLive] = useState(false);
  const [denied, setDenied] = useState(false);
  const [torch, setTorch] = useState(false);
  const [flash, setFlash] = useState(false);
  const [help, setHelp] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const tags = DISH.tags ?? [];
  const found = useFound(mode === "meal" ? tags.length : 0, mode);
  const read = useRead(mode);
  const done = found >= tags.length;
  const sofar = useMemo(() => {
    const names = tags.slice(0, found).map((t) => t.food);
    return totalsOf(DISH.items.filter((p) => names.includes(p.food)));
  }, [found, tags]);
  const slot = slotName(slotAt(new Date()));

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = s;
      setLive(true);
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
      });
    } catch {
      setDenied(true);
    }
  };

  const logMeal = (photo: string) => {
    stream.current?.getTracks().forEach((t) => t.stop());
    // the plate was read live: a finished read logs ready, an early tap keeps reading on the result page
    const id = food.scan(photo, DISH.id, done && !live);
    nav(`/v3/food/meal/${id}`, { replace: true });
  };
  const addPack = () => nav(`/v3/food/add?pick=${PACK.food}&g=${PACK.grams}&found=${mode}`, { replace: true });

  const shoot = () => {
    if (mode !== "meal") {
      if (read) addPack();
      return;
    }
    setFlash(true);
    window.setTimeout(() => {
      const v = video.current;
      logMeal(live && v && v.videoWidth ? grab(v, v.videoWidth, v.videoHeight) : DISH.photo);
    }, 240);
  };

  const fromLibrary = (f: File | undefined) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => logMeal(grab(img, img.naturalWidth, img.naturalHeight));
    img.src = URL.createObjectURL(f);
  };

  const pack = foodOf(PACK.food);
  const packT = totalsOf([{ food: PACK.food, grams: PACK.grams }]);

  return (
    <V2Screen nav={false} tone={mode === "meal" || live ? "light" : "dark"}>
      <div className="sc" data-mode={mode} data-done={mode === "meal" ? (done ? "" : undefined) : read ? "" : undefined}>
        {live ? <video ref={video} className="sc-feed" playsInline muted /> : <img className="sc-feed" src={mode === "meal" ? DISH.scene : YOGURT_SCENE} alt="" />}
        {torch && <i className="sc-torchlight" aria-hidden />}

        <header className="sc-top">
          <button className="sc-round" aria-label="Close camera" onClick={() => nav(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <span className="sc-status" aria-live="polite">
            <i aria-hidden />
            {mode === "meal" ? (done ? `${tags.length} foods found` : found ? `Found ${found} of ${tags.length}` : "Looking for food") : read ? "Read" : mode === "barcode" ? "Looking for a barcode" : "Looking for a label"}
          </span>
          <button className="sc-round" aria-label="How scanning works" onClick={() => setHelp(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M9.2 9a2.9 2.9 0 1 1 3.9 2.7c-.7.3-1.1.9-1.1 1.6v.7" />
              <circle cx="12" cy="17.6" r=".6" fill="currentColor" />
            </svg>
          </button>
        </header>

        {/* the frame, and the light passing through it */}
        <div className="sc-frame" aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <span className="sc-beam">
            <b />
          </span>
          {mode === "barcode" && read && <span className="sc-code">EAN-13 · {PACK.code}</span>}
        </div>

        {/* each food pinned where it sits */}
        {mode === "meal" &&
          !live &&
          tags.slice(0, found).map((t) => {
            const f = foodOf(t.food);
            const p = DISH.items.find((x) => x.food === t.food)!;
            return (
              <span key={t.food} className="sc-tag" data-side={t.x > 0.58 ? "left" : "right"} style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}>
                <i aria-hidden />
                <span>
                  <b>{f.name}</b>
                  <small>
                    {fmt((f.kcal * p.grams) / 100)} kcal · {p.grams} g
                  </small>
                </span>
              </span>
            );
          })}

        {!live && (
          <button className="sc-live" onClick={startCamera}>
            {denied ? "Camera not available, showing a sample" : "Use camera"}
          </button>
        )}

        {/* the read, adding up as it goes */}
        {/* the read appears once the scan finds its first food, then counts up */}
        {mode === "meal" ? (
          found > 0 && (
          <section className="sc-card" aria-label="Live nutrition read">
            <div className="sc-card-head">
              <span>
                <small>{done ? "Ready to log" : "Analysing"}</small>
                <b>{done ? DISH.name : "Reading your plate…"}</b>
              </span>
              <Ring value={found / tags.length} size={40} stroke={3.5} hue="#fff">
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  <small>{found}</small>
                )}
              </Ring>
            </div>
            <div className="sc-card-kcal">
              <NutrientMark id="kcal" size={22} />
              <b>{fmt(sofar.kcal)}</b>
              <span>kcal</span>
            </div>
            <div className="sc-card-macros">
              {MACROS.map((k) => (
                <span key={k}>
                  <em>
                    <i style={{ background: NUTRIENT[k].hue }} />
                    {NUTRIENT[k].short}
                  </em>
                  <b>{Math.round(sofar[k])} g</b>
                </span>
              ))}
            </div>
          </section>
          )
        ) : (
          read && (
            <section className="sc-card sc-pack" aria-label="Product read">
              <div className="sc-pack-top">
                <img src={YOGURT_SCENE} alt="" />
                <span>
                  <small>{mode === "barcode" ? `Barcode ${PACK.code}` : "Nutrition label · per 100 g"}</small>
                  <b>{pack.name}</b>
                  <em>
                    {PACK.brand} · {PACK.grams} g pot
                  </em>
                </span>
              </div>
              {mode === "label" ? (
                <dl className="sc-panel">
                  <div>
                    <dt>Energy</dt>
                    <dd>{pack.kcal} kcal</dd>
                  </div>
                  {MACROS.map((k) => (
                    <div key={k}>
                      <dt>{NUTRIENT[k].short}</dt>
                      <dd>{pack[k]} g</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="sc-card-macros">
                  <span>
                    <em>Energy</em>
                    <b>{fmt(packT.kcal)} kcal</b>
                  </span>
                  {MACROS.map((k) => (
                    <span key={k}>
                      <em>
                        <i style={{ background: NUTRIENT[k].hue }} />
                        {NUTRIENT[k].short}
                      </em>
                      <b>{Math.round(packT[k])} g</b>
                    </span>
                  ))}
                </div>
              )}
              <button className="sc-pack-add" onClick={addPack}>
                Add to {slot}
              </button>
            </section>
          )
        )}

        <div className="sc-modes" role="tablist" aria-label="What to scan">
          {MODES.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === mode} onClick={() => setMode(x.id)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {x.icon}
              </svg>
              {x.name}
            </button>
          ))}
        </div>

        <div className="sc-foot">
          <button className="sc-lib" aria-label="Choose from photos" onClick={() => file.current?.click()}>
            <img src={dishOf("salmon-bowl")!.photo} alt="" />
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => fromLibrary(e.target.files?.[0])} />
          <button className="sc-shutter" aria-label={mode === "meal" ? "Take photo and log" : "Add this food"} onClick={shoot} disabled={mode !== "meal" && !read}>
            <i />
          </button>
          <button className="sc-round sc-torch" aria-label={torch ? "Light off" : "Light on"} aria-pressed={torch} onClick={() => setTorch(!torch)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={torch ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="M13 3 5.5 13.5H11L10 21l7.5-10.5H12z" />
            </svg>
          </button>
        </div>

        {flash && <i className="sc-flash" aria-hidden />}

        {help && (
          <div className="sc-help-scrim" onClick={() => setHelp(false)}>
            <div className="sc-help" role="dialog" aria-label="Scanning tips" onClick={(e) => e.stopPropagation()}>
              <h2>Getting a good read</h2>
              <ol>
                <li>
                  <b>Shoot from above</b>
                  <span>The whole plate in the frame, nothing cut off.</span>
                </li>
                <li>
                  <b>Good light</b>
                  <span>Daylight or a bright room; turn the light on at night.</span>
                </li>
                <li>
                  <b>Check the result</b>
                  <span>You can change any ingredient or its amount before you log it.</span>
                </li>
              </ol>
              <button onClick={() => setHelp(false)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </V2Screen>
  );
}
