/**
 * Bakes the card illustrations for the redesign (src/v2/ui/Art.tsx).
 *
 * Each card carries one glossy object, tonal with the card.
 * These are real 3D renders rather than drawn gradients, so light falls on
 * every object the same way. three.js comes from the phenome-digital-twin
 * checkout, as in bake-twin.mjs; output is a transparent 480px PNG per object.
 *
 * Usage: node scripts/bake-art.mjs [path to phenome-digital-twin checkout]
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { chromium } from "playwright";

const TWIN_DIR = resolve(process.argv[2] ?? join(homedir(), "Projects/phenome-digital-twin"));
const OUT_DIR = resolve("public/assets/art");
const SIZE = 480;

const page = `<!doctype html><script type="module">
import * as T from "/three.module.js";

const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
r.setPixelRatio(1);
r.setSize(${SIZE}, ${SIZE}, false);
r.setClearColor(0, 0);

/* a soft studio: big white card overhead, a warm fill low left, a cool kick right */
function studio() {
  const s = new T.Scene();
  s.background = new T.Color(0x8d93a6);
  const card = (color, power, w, h, pos) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(power), side: T.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  card("#ffffff", 9, 7, 5, [-2, 6, 4]);
  card("#fff0dc", 3, 4, 6, [-7, -1, 3]);
  card("#dcecff", 4, 3, 7, [7, 1, 1]);
  card("#ffffff", 2, 8, 3, [0, -6, 2]);
  return new T.PMREMGenerator(r).fromScene(s, 0.04).texture;
}
const env = studio();

const gloss = (color, o = {}) => new T.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.22, envMapIntensity: 0.62, ...o });
const mesh = (g, m, p = [0, 0, 0], rot = [0, 0, 0], s = 1) => {
  const x = new T.Mesh(g, m);
  x.position.set(...p);
  x.rotation.set(...rot);
  x.scale.setScalar(s);
  return x;
};
const group = (...kids) => {
  const g = new T.Group();
  g.add(...kids);
  return g;
};
const extrude = (shape, depth, bevel) =>
  new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 24, curveSegments: 64 }).center();
const sphere = (d) => new T.SphereGeometry(d, 64, 48);
const lathe = (pts) => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), 96);
const puff = (shape, r) => extrude(shape, 0.02, r);
const capsule = (rad, len) => new T.CapsuleGeometry(rad, len, 24, 48);

function teardrop() {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI;
    pts.push([Math.max(Math.sin(a) * Math.sin(a / 2) ** 1.1 * 1.06, 0.0001), Math.cos(a) * 1.2]);
  }
  return pts;
}
/** a soft-edged block: the sugar cube */
function roundedBox(w, r) {
  const q = new T.Shape();
  q.absarc(w / 2 - r, w / 2 - r, r, 0, Math.PI / 2);
  q.absarc(-w / 2 + r, w / 2 - r, r, Math.PI / 2, Math.PI);
  q.absarc(-w / 2 + r, -w / 2 + r, r, Math.PI, Math.PI * 1.5);
  q.absarc(w / 2 - r, -w / 2 + r, r, Math.PI * 1.5, Math.PI * 2);
  return extrude(q, w - 0.2, 0.1);
}
function heartShape() {
  const s = new T.Shape();
  s.moveTo(0, -1.05);
  s.bezierCurveTo(-0.4, -0.72, -1.1, -0.2, -1.1, 0.38);
  s.bezierCurveTo(-1.1, 0.86, -0.72, 1.08, -0.42, 1.08);
  s.bezierCurveTo(-0.2, 1.08, -0.06, 0.96, 0, 0.8);
  s.bezierCurveTo(0.06, 0.96, 0.2, 1.08, 0.42, 1.08);
  s.bezierCurveTo(0.72, 1.08, 1.1, 0.86, 1.1, 0.38);
  s.bezierCurveTo(1.1, -0.2, 0.4, -0.72, 0, -1.05);
  return s;
}
function star(points, outer, inner) {
  const s = new T.Shape();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const d = i % 2 ? inner : outer;
    if (i) s.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    else s.moveTo(Math.cos(a) * d, Math.sin(a) * d);
  }
  s.closePath();
  return s;
}
/** a red cell: a disc dimpled on both faces */
function cell(color) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI;
    const x = Math.sin(t) ** 0.8 * 1;
    const dimple = 0.2 + 0.26 * x ** 2;
    pts.push([Math.max(x, 0.0001), Math.cos(t) * dimple]);
  }
  return mesh(lathe(pts), gloss(color, { roughness: 0.26 }));
}

const OBJECTS = {
  heart: () => {
    /* a sphere pushed out to the heart's outline, so the surface stays one smooth inflated skin */
    const N = 720;
    const polar = new Float32Array(N).fill(0);
    const hits = new Float32Array(N).fill(0);
    for (let i = 0; i < 2880; i++) {
      const a = (i / 2880) * Math.PI * 2;
      const x = 16 * Math.sin(a) ** 3;
      const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a) + 3;
      const k = Math.floor(((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * N) % N;
      polar[k] += Math.hypot(x, y);
      hits[k] += 1;
    }
    const outline = Array.from(polar, (sum, i) => (hits[i] ? sum / hits[i] : -1));
    for (let i = 0; i < N; i++) if (outline[i] < 0) outline[i] = outline[(i + N - 1) % N];
    /* a little blur rounds the cleft and the tip */
    const R = outline.map((_, i) => {
      let sum = 0;
      for (let d = -9; d <= 9; d++) sum += outline[(i + d + N) % N];
      return sum / 19 / 16;
    });
    const radius = (t) => {
      const u = ((((t + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * N) % N;
      const i = Math.floor(u);
      return R[i] + (R[(i + 1) % N] - R[i]) * (u - i);
    };
    const inflate = (v) => {
      const t = Math.atan2(v.y, v.x);
      /* the outline only holds at the rim: toward the middle it melts into a dome, or the poles pinch */
      const rho = Math.min(1, Math.hypot(v.x, v.y) / 0.9);
      const melt = rho * rho * (3 - 2 * rho);
      const k = 1 + (radius(t) * 1.16 - 1) * melt;
      return new T.Vector3(v.x * k, v.y * k, v.z * 0.68 * (0.7 + 0.3 * k));
    };
    const g = new T.SphereGeometry(1, 256, 192);
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const up = new T.Vector3(0.31, 0.77, 0.56);
    for (let i = 0; i < pos.count; i++) {
      const v = new T.Vector3().fromBufferAttribute(pos, i).normalize();
      const t1 = new T.Vector3().crossVectors(v, up).normalize();
      const t2 = new T.Vector3().crossVectors(v, t1);
      const p = inflate(v);
      const a = inflate(v.clone().addScaledVector(t1, 0.003).normalize()).sub(p);
      const b = inflate(v.clone().addScaledVector(t2, 0.003).normalize()).sub(p);
      const n = new T.Vector3().crossVectors(a, b).normalize();
      if (n.dot(p) < 0) n.negate();
      pos.setXYZ(i, p.x, p.y, p.z);
      nor.setXYZ(i, n.x, n.y, n.z);
    }
    return mesh(g, gloss("#ff5f73"), [0, 0, 0], [0.1, -0.34, -0.1]);
  },

  moon: () => {
    /* a disc with a second circle cut away, traced as an outline: long way round one, back along the other */
    const [r1, r2, cx, cy] = [1.1, 0.86, 0.56, 0.3];
    const d = Math.hypot(cx, cy);
    const base = Math.atan2(cy, cx);
    const a = Math.acos((r1 ** 2 + d ** 2 - r2 ** 2) / (2 * r1 * d));
    const from = (t) => Math.atan2(r1 * Math.sin(t) - cy, r1 * Math.cos(t) - cx);
    const moon = new T.Shape();
    moon.absarc(0, 0, r1, base + a, base - a + Math.PI * 2, false);
    moon.absarc(cx, cy, r2, from(base - a), from(base + a), true);
    return group(
      mesh(puff(moon, 0.22), gloss("#d9b2f5"), [-0.12, -0.02, 0], [0.1, 0.32, -0.2], 0.92),
      mesh(puff(star(4, 0.34, 0.12), 0.08), gloss("#ffe9fb"), [0.72, 0.62, 0.2], [0.1, -0.3, 0.2]),
      mesh(puff(star(4, 0.16, 0.06), 0.05), gloss("#ffe9fb"), [0.28, -0.22, 0.3], [0.1, -0.3, -0.1]),
    );
  },

  gauge: () => {
    const arc = new T.TorusGeometry(0.92, 0.3, 40, 160, Math.PI * 1.5);
    return group(
      mesh(new T.TorusGeometry(0.92, 0.3, 40, 160), gloss("#4f96d1", { roughness: 0.4 }), [0, 0, -0.04], [-0.26, 0.34, 0]),
      mesh(arc, gloss("#bfe4f5"), [0, 0, 0.02], [-0.26, 0.34, -Math.PI / 2 + 0.4], 1.015),
      mesh(sphere(0.3), gloss("#ffffff"), [0.86, 0.36, 0.28]),
    );
  },

  flame: () => {
    const s = new T.Shape();
    s.moveTo(0, -1.1);
    s.bezierCurveTo(-0.72, -1.1, -1, -0.56, -0.92, -0.1);
    s.bezierCurveTo(-0.86, 0.26, -0.58, 0.46, -0.5, 0.74);
    s.bezierCurveTo(-0.26, 0.56, -0.2, 0.34, -0.18, 0.2);
    s.bezierCurveTo(0.2, 0.42, 0.34, 0.86, 0.14, 1.24);
    s.bezierCurveTo(0.68, 0.98, 1, 0.42, 0.92, -0.16);
    s.bezierCurveTo(0.86, -0.72, 0.5, -1.1, 0, -1.1);
    const inner = new T.Shape();
    inner.moveTo(0, -0.62);
    inner.bezierCurveTo(-0.4, -0.62, -0.56, -0.32, -0.5, -0.06);
    inner.bezierCurveTo(-0.44, 0.2, -0.16, 0.26, -0.02, 0.56);
    inner.bezierCurveTo(0.3, 0.32, 0.52, 0.06, 0.5, -0.16);
    inner.bezierCurveTo(0.48, -0.44, 0.3, -0.62, 0, -0.62);
    return group(
      mesh(puff(s, 0.26), gloss("#f09343"), [0, 0, 0], [0.08, -0.32, 0]),
      mesh(puff(inner, 0.14), gloss("#ffe3a8"), [0.1, -0.2, 0.42], [0.08, -0.32, 0]),
    );
  },

  apple: () => {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * Math.PI;
      const x = Math.sin(t) * (1.02 + 0.14 * Math.cos(t));
      const y = Math.cos(t) * 0.98 - 0.3 * Math.exp(-((x / 0.3) ** 2)) * Math.sign(Math.cos(t)) * (Math.cos(t) > 0 ? 1 : 0.5);
      pts.push([Math.max(x, 0.0001), y]);
    }
    const leaf = new T.Shape();
    leaf.moveTo(0, 0);
    leaf.bezierCurveTo(0.14, 0.34, 0.5, 0.42, 0.74, 0.3);
    leaf.bezierCurveTo(0.62, 0.02, 0.26, -0.1, 0, 0);
    return group(
      mesh(lathe(pts), gloss("#a6e23c")),
      mesh(capsule(0.05, 0.42), gloss("#7a4a22", { roughness: 0.6 }), [0.04, 0.82, 0], [0, 0, -0.16]),
      mesh(extrude(leaf, 0.02, 0.03), gloss("#35b45a"), [0.42, 1.0, 0.04], [0.3, -0.3, 0.12]),
    ).rotateX(0.16).rotateZ(-0.12);
  },

  dumbbell: () => {
    /* plates with rounded rims, large inside, small outside */
    const plate = (r, w) => lathe([[0.0001, -w / 2], [r - 0.08, -w / 2], [r, -w / 2 + 0.08], [r, w / 2 - 0.08], [r - 0.08, w / 2], [0.0001, w / 2]]);
    const big = gloss("#263980");
    const small = gloss("#4374af");
    const end = (s) =>
      group(
        mesh(plate(0.62, 0.3), big, [s * 0.72, 0, 0], [0, 0, Math.PI / 2]),
        mesh(plate(0.46, 0.22), small, [s * 0.98, 0, 0], [0, 0, Math.PI / 2]),
      );
    return group(mesh(capsule(0.12, 2.3), gloss("#eef6fb", { roughness: 0.2 }), [0, 0, 0], [0, 0, Math.PI / 2]), end(-1), end(1))
      .rotateX(0.26)
      .rotateY(-0.5)
      .rotateZ(0.34);
  },

  bone: () => {
    const m = gloss("#f2fdff");
    return group(
      mesh(capsule(0.24, 1.5), m),
      mesh(sphere(0.33), m, [-0.2, 1.0, 0]),
      mesh(sphere(0.33), m, [0.2, 1.0, 0]),
      mesh(sphere(0.33), m, [-0.2, -1.0, 0]),
      mesh(sphere(0.33), m, [0.2, -1.0, 0]),
    ).rotateZ(-0.7).rotateX(0.3);
  },

  check: () => {
    const pts = [[-0.56, 0.02, 0.5], [-0.14, -0.42, 0.5], [0.62, 0.46, 0.5]];
    return group(
      mesh(new T.TorusGeometry(0.98, 0.24, 40, 160), gloss("#2fe0b0")),
      ...[[pts[0], pts[1]], [pts[1], pts[2]]].map(([a, b]) => {
        const A = new T.Vector3(...a), B = new T.Vector3(...b);
        const len = A.distanceTo(B);
        const seg = mesh(capsule(0.17, len), gloss("#ffffff"));
        seg.position.copy(A.clone().add(B).multiplyScalar(0.5));
        seg.rotation.z = Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2;
        return seg;
      }),
    ).rotateX(-0.26).rotateY(0.38);
  },

  cells: () =>
    group(
      cell("#ff4a64").translateX(-0.42).translateY(0.36).rotateX(0.9).rotateZ(0.4),
      cell("#ff6b7f").translateX(0.6).translateY(-0.34).translateZ(0.3).rotateX(1.2).rotateY(0.5).rotateZ(-0.5),
    ),

  molecule: () => {
    const c = "#7cc3ea";
    const b = gloss("#e4f2ff", { roughness: 0.22 });
    const bond = (a, z) => mesh(new T.CylinderGeometry(0.08, 0.08, 0.9, 24), b, a, [0, 0, z]);
    return group(
      mesh(sphere(0.6), gloss(c), [0, 0, 0]),
      mesh(sphere(0.4), gloss("#ffffff"), [0.92, 0.5, 0.1]),
      mesh(sphere(0.4), gloss("#ffffff"), [-0.84, 0.62, -0.2]),
      mesh(sphere(0.34), gloss(c), [0.1, -1.06, 0.2]),
      bond([0.5, 0.27, 0.06], -1.07),
      bond([-0.46, 0.34, -0.1], 0.94),
      bond([0.06, -0.56, 0.1], 0.08),
    ).rotateY(0.3);
  },

  ripple: () =>
    group(
      mesh(new T.TorusGeometry(1.08, 0.13, 32, 160), gloss("#7cc3ea")),
      mesh(new T.TorusGeometry(0.72, 0.14, 32, 160), gloss("#bfe4f5")),
      mesh(sphere(0.36), gloss("#ffffff"), [0, 0, 0.04]),
    ).rotateX(-0.72).rotateY(0.34),

  pulse: () => {
    const pts = [[-1.34, -0.12], [-0.72, -0.12], [-0.46, 0.34], [-0.18, -0.12], [0.02, -0.12], [0.3, 0.92], [0.62, -0.9], [0.84, -0.12], [1.34, -0.12]];
    const seg = pts.slice(1).map(([x, y], i) => {
      const A = new T.Vector3(pts[i][0], pts[i][1], 0);
      const B = new T.Vector3(x, y, 0);
      const m = mesh(capsule(0.1, A.distanceTo(B)), gloss("#ffffff"));
      m.position.copy(A.clone().add(B).multiplyScalar(0.5));
      m.rotation.z = Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2;
      return m;
    });
    return group(...seg, mesh(sphere(0.2), gloss("#7cc3ea"), [1.34, -0.12, 0])).rotateX(0.14).rotateY(-0.34);
  },

  pin: () => {
    return group(mesh(lathe(teardrop()), gloss("#eafbe9"), [0, 0, 0], [Math.PI, 0, 0]), mesh(new T.TorusGeometry(0.28, 0.11, 32, 96), gloss("#4fb655"), [0, 0.26, 0.82], [0, 0, 0])).rotateY(-0.26).rotateZ(-0.16);
  },

  thermo: () =>
    group(
      mesh(capsule(0.3, 1.6), gloss("#e8e2ff", { roughness: 0.2 }), [0, 0.3, 0]),
      mesh(sphere(0.52), gloss("#ff6f8b"), [0, -0.92, 0]),
      mesh(capsule(0.13, 0.9), gloss("#ff6f8b"), [0, -0.1, 0.22]),
    ).rotateZ(-0.46).rotateX(0.2),

  sugar: () =>
    group(
      mesh(roundedBox(1.0, 0.16), gloss("#ffffff", { roughness: 0.5 }), [-0.5, -0.4, 0], [0.5, 0.6, 0.1]),
      mesh(roundedBox(0.82, 0.14), gloss("#fff3e4", { roughness: 0.5 }), [0.56, -0.34, -0.2], [0.4, -0.5, -0.1]),
      mesh(roundedBox(0.72, 0.13), gloss("#ffffff", { roughness: 0.5 }), [0.08, 0.56, 0.1], [0.7, 0.3, 0.4]),
    ),

  drop: () => {
    return mesh(lathe(teardrop()), gloss("#7cc3ea"), [0, 0, 0], [0.16, 0, -0.24], 1);
  },
};

const camera = new T.PerspectiveCamera(26, 1, 0.1, 50);
camera.position.set(0, 0, 7.4);

window.bake = (name) => {
  const scene = new T.Scene();
  scene.environment = env;
  const key = new T.DirectionalLight(0xffffff, 0.9);
  key.position.set(-2.5, 4, 5);
  scene.add(key);
  scene.add(OBJECTS[name]());
  r.clear();
  r.render(scene, camera);
  return r.domElement.toDataURL("image/png");
};
window.names = Object.keys(OBJECTS);
window.ready = true;
</script>`;

const server = createServer((req, res) => {
  if (req.url === "/three.module.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(readFileSync(join(TWIN_DIR, "vendor/three.module.js")));
    return;
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(page);
}).listen(0);

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=default", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
try {
  const tab = await browser.newPage();
  tab.on("pageerror", (e) => console.error(e));
  await tab.goto(`http://localhost:${server.address().port}/`);
  await tab.waitForFunction("window.ready", null, { timeout: 30000 });
  const names = await tab.evaluate("window.names");
  const only = process.argv[3]?.split(",");
  for (const name of names) {
    if (only && !only.includes(name)) continue;
    const url = await tab.evaluate((n) => window.bake(n), name);
    writeFileSync(join(OUT_DIR, `${name}.png`), Buffer.from(url.split(",")[1], "base64"));
    console.log(name);
  }
} finally {
  await browser.close();
  server.close();
}
