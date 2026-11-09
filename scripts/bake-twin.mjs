/**
 * Bakes the digital twin into cell maps for the redesign (src/v2/twin).
 *
 * The tone pass and every halftone number are the Phenome web viewer's own,
 * lifted from phenome-twin-mobile.html: GLB → tone buffer → one dot per screen
 * cell. The only change is where the last step runs. Instead of drawing the
 * dots in a fragment shader, each cell's coverage is written to one pixel of a
 * PNG, so the app can draw the same dots on a canvas and let data move them.
 *
 *   R = coverage (dot area, 0-1)   G = tone bright (colour ramp position)
 *
 * Usage: node scripts/bake-twin.mjs [path to phenome-digital-twin checkout]
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { chromium } from "playwright";

const TWIN_DIR = resolve(process.argv[2] ?? join(homedir(), "Projects/phenome-digital-twin"));
const OUT_DIR = resolve("public/assets/twin");
export const GRID = { cols: 80, rows: 92 };

/** yaw/pitch in degrees: per-model turn so each organ faces the reader the way its card does. */
const TARGETS = [
  { name: "body", file: "GLB/Male.glb", kind: "body" },
  { name: "body-female", file: "GLB/Female.glb", kind: "body" },
  /* Home's twin tile: digitaltwin.html's home figure, one per sex; each writes a frame json beside it */
  { name: "hero", file: "GLB/Male.glb", kind: "hero" },
  { name: "hero-female", file: "GLB/Female.glb", kind: "hero" },
  { name: "brain", file: "GLB/organ/pink_brain.glb" },
  { name: "thyroid", file: "GLB/organ/bodyparts3d_thyroid.glb" },
  { name: "lungs", file: "GLB/organ/realistic_human_lungs.glb" },
  { name: "heart", file: "GLB/organ/realistic_human_heart.glb" },
  { name: "liver", file: "GLB/organ/human_liver_and_gallbladder.glb", yaw: 90 },
  { name: "gut", file: "GLB/organ/small_and_large_intestine.glb" },
  { name: "kidneys", file: "GLB/organ/human_kidney.glb" },
  { name: "bone", file: "GLB/skeletal/lumbar-hip.glb" },
];

const MIME = { ".html": "text/html", ".js": "text/javascript", ".glb": "model/gltf-binary" };
const html = readFileSync(join(TWIN_DIR, "phenome-twin-mobile.html"), "utf8");
const from = html.indexOf("const BODY_H = 2.6");
const to = html.indexOf("/* ---- pass 2");
if (from < 0 || to < 0) throw new Error("twin pipeline markers not found in phenome-twin-mobile.html");
const pipeline = html.slice(from, to);

const bakePage = `<!doctype html><script type="module">
import * as THREE from "/vendor/three.module.js";
${pipeline}
const { cols, rows, cell } = window.__grid;
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
renderer.autoClear = false; renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(1);
const camera = new THREE.PerspectiveCamera(FOV, cols / rows, 0.05, 200);

/* the viewer's numbers, verbatim from the mobile page's halftone uniforms */
const FLOOR = 0.055, CONTRAST = 1.8;

/* grid defaults to the twin's 80 x 92; the hero passes its own grid and floor */
function cells(root, grid = { cols, rows, cell, floor: FLOOR }) {
  const { cols, rows, cell, floor: FLOOR } = grid;
  const W = cols * cell, H = rows * cell;
  renderer.setSize(W, H, false);
  const rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true });
  renderer.setRenderTarget(rt); renderer.clear(true, true, true);
  const scene = new THREE.Scene(); scene.add(root);
  renderer.render(scene, camera);
  const px = new Uint8Array(W * H * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
  renderer.setRenderTarget(null);
  rt.dispose();
  const c = document.createElement("canvas"); c.width = cols; c.height = rows;
  const g = c.getContext("2d"), out = g.createImageData(cols, rows);
  const off = Math.round(cell * 0.34);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const cx = Math.round((col + 0.5) * cell), cy = Math.round((rows - row - 0.5) * cell);
    let tsum = 0, asum = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const x = Math.min(W - 1, Math.max(0, cx + i * off)), y = Math.min(H - 1, Math.max(0, cy + j * off));
      const k = (y * W + x) * 4, a = px[k + 3] / 255;
      tsum += (px[k] / 255) * a; asum += a;
    }
    const av = asum / 9, tv = asum > 1e-4 ? tsum / asum : 0, bright = 1 - tv;
    const cov = av * (FLOOR + (1 - FLOOR) * Math.pow(Math.min(1, Math.max(0, bright)), CONTRAST));
    const o = (row * cols + col) * 4;
    out.data[o] = Math.round(cov * 255); out.data[o + 1] = Math.round(bright * 255); out.data[o + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}
const png = (c) => c.toDataURL("image/png");

/* digitaltwin.html's home figure, with its numbers verbatim: the 1366 x 1024
   stage, FRAME, yaw 12, camera rise 3, the waist fade and Contour Fade's
   floor 0.19. The stage is baked whole, then cropped to the figure. The pitch is
   coarser than the viewer's 5: the tile shows the stage at about a quarter of
   its width, and 5 would leave dots near 2 px that alias into a cross-hatch. */
const HERO = { stageW: 1366, stageH: 1024, target: 1.92, dist: 3.55, fov: 30, yaw: 12, elev: 3,
               fade: [0.46 * BODY_H, 0.60 * BODY_H], pitch: 9, floor: 0.19, pad: 3 };

function hero(raw) {
  const holder = fitToFloor(raw, BODY_H);
  const pivot = new THREE.Group(); pivot.add(holder);
  pivot.rotation.y = HERO.yaw * Math.PI / 180; pivot.updateMatrixWorld(true);
  matTone.uniforms.uFadeLo.value = HERO.fade[0]; matTone.uniforms.uFadeHi.value = HERO.fade[1];
  const el = HERO.elev * Math.PI / 180;
  camera.fov = HERO.fov; camera.aspect = HERO.stageW / HERO.stageH;
  camera.position.set(0, HERO.target + Math.sin(el) * HERO.dist, Math.cos(el) * HERO.dist);
  camera.lookAt(0, HERO.target, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const full = { cols: Math.floor(HERO.stageW / HERO.pitch), rows: Math.floor(HERO.stageH / HERO.pitch) };
  const src = cells(pivot, { ...full, cell: HERO.pitch * 2, floor: HERO.floor });
  const d = src.getContext("2d").getImageData(0, 0, full.cols, full.rows).data;
  let x0 = full.cols, x1 = 0, y0 = full.rows, y1 = 0;
  for (let i = 0; i < full.cols * full.rows; i++) {
    if (d[i * 4] < 2) continue;
    const x = i % full.cols, y = (i - x) / full.cols;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  x0 = Math.max(0, x0 - HERO.pad); y0 = Math.max(0, y0 - HERO.pad);
  x1 = Math.min(full.cols - 1, x1 + HERO.pad); y1 = Math.min(full.rows - 1, y1 + HERO.pad);
  const out = document.createElement("canvas"); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext("2d").drawImage(src, -x0, -y0);
  /* the organ seats are in the viewer's SVG units; fit the affine that carries
     them into this crop's cells, through the same pivot and camera */
  const at = (sx, sy) => {
    const v = new THREE.Vector3((sx - 100) * K, svgToWorld(sy), 0).applyMatrix4(pivot.matrixWorld).project(camera);
    return [((v.x + 1) / 2) * full.cols - x0, ((1 - v.y) / 2) * full.rows - y0];
  };
  const [a0, a1] = [at(60, 100), at(140, 100)], [b0, b1] = [at(100, 60), at(100, 220)];
  const sx = (a1[0] - a0[0]) / 80, sy = (b1[1] - b0[1]) / 160;
  const frame = { cols: out.width, rows: out.height, svg: [sx, a0[0] - 60 * sx, sy, b0[1] - 60 * sy] };
  return { png: png(out), frame };
}

window.__bake = async ({ file, kind, yaw = 0, pitch = 0 }) => {
  const raw = await loadGLB("/" + file);
  raw.traverse((o) => { if (o.isMesh) o.material = matTone; });
  if (kind === "hero") return hero(raw);
  camera.fov = FOV; camera.aspect = cols / rows;
  if (kind === "body") {
    /* the home figure's framing: arms out, legs running out into the field */
    const vb = [-56, -8, 312, 312 * rows / cols], fade = [248, 342];
    matTone.uniforms.uFadeHi.value = svgToWorld(fade[0]); matTone.uniforms.uFadeLo.value = svgToWorld(fade[1]);
    const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2, tx = (cx - 100) * K, ty = TOP - cy * K;
    camera.position.set(tx, ty, (vb[3] * K / 2) / Math.tan(FOV * Math.PI / 360));
    camera.lookAt(tx, ty, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return png(cells(fitToFloor(raw, BODY_H)));
  }
  matTone.uniforms.uFadeHi.value = -999; matTone.uniforms.uFadeLo.value = -1000;
  const holder = new THREE.Group(); holder.add(raw);
  holder.rotation.set(pitch * Math.PI / 180, yaw * Math.PI / 180, 0); holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  /* the organ fills 74% of the field's short side, so it reads as a specimen with air around it */
  const span = Math.max(size.x / (cols / rows), size.y) / 0.74;
  const dist = (span / 2) / Math.tan(FOV * Math.PI / 360) + size.z / 2;
  camera.position.set(mid.x, mid.y, mid.z + dist); camera.lookAt(mid); camera.near = dist / 50; camera.far = dist * 10;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return png(cells(holder));
};
window.__ready = true;
</script>`;

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/bake.html") return res.writeHead(200, { "content-type": "text/html" }).end(bakePage);
  const file = join(TWIN_DIR, url);
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const only = process.env.ONLY?.split(",");
mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page:", e.message));
await page.addInitScript((g) => { window.__grid = g; }, { ...GRID, cell: 6 });
await page.goto(`http://localhost:${port}/bake.html`);
await page.waitForFunction("window.__ready === true", null, { timeout: 60000 });
for (const t of TARGETS) {
  if (only && !only.includes(t.name)) continue;
  const res = await page.evaluate((target) => window.__bake(target), t);
  const data = typeof res === "string" ? res : res.png;
  if (res.frame) writeFileSync(join(OUT_DIR, `${t.name}.json`), JSON.stringify(res.frame) + "\n");
  const buf = Buffer.from(data.split(",")[1], "base64");
  writeFileSync(join(OUT_DIR, `${t.name}.png`), buf);
  console.log(t.name, buf.length, "bytes");
}
await browser.close();
server.close();
