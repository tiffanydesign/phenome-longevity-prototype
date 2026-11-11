import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

/**
 * The two app editions (src/v2 and src/v3) share class names, custom properties
 * and keyframe names. Every rule in an edition's stylesheets is scoped to the
 * edition mark that main.tsx sets on <html> (data-ver), and v3's keyframes are renamed,
 * so whichever edition is on screen styles only itself.
 */
const EDITION_SCOPE = {
  v2: ':not([data-ver="v3"])',
  v3: '[data-ver="v3"]',
} as const;

function scopeSelector(sel: string, attr: string): string {
  const s = sel.trim();
  // rules that already start at the document root take the mark on the root itself
  const root = s.match(/^(:root|html)((?:\[[^\]]*\]|:not\([^)]*\))*)/);
  if (root) return `${root[1]}${root[2]}${attr}${s.slice(root[0].length)}`;
  // pseudo-elements of the document itself (view transitions) hang off the root
  if (s.startsWith("::")) return `:root${attr}${s}`;
  return `:root${attr} ${s}`;
}

function editionScope(): Plugin {
  return {
    name: "edition-scope",
    enforce: "pre",
    async transform(code, id) {
      const file = id.split("?")[0].replace(/\\/g, "/");
      const m = file.match(/\/src\/(v2|v3)\/.*\.css$/);
      if (!m) return null;
      const ed = m[1] as keyof typeof EDITION_SCOPE;
      const { default: postcss } = await import("postcss");
      const root = postcss.parse(code, { from: file });
      const frames = new Set<string>();
      root.walkAtRules("keyframes", (at) => {
        if (ed === "v3") {
          frames.add(at.params);
          at.params = `v3-${at.params}`;
        }
      });
      root.walkRules((rule) => {
        const parent = rule.parent;
        if (parent && parent.type === "atrule" && /keyframes$/.test((parent as { name: string }).name)) return;
        rule.selectors = rule.selectors.map((s) => scopeSelector(s, EDITION_SCOPE[ed]));
      });
      if (ed === "v3" && frames.size) {
        root.walkDecls(/^animation(-name)?$/, (d) => {
          d.value = d.value.replace(/[A-Za-z_][\w-]*/g, (w) => (frames.has(w) ? `v3-${w}` : w));
        });
      }
      return { code: root.toString(), map: null };
    },
  };
}

/**
 * Each edition has its own address (see src/lib/edition.ts). The page is the
 * same for all three; a copy in each folder lets GitHub Pages serve it there.
 */
function editionPages(): Plugin {
  return {
    name: "edition-pages",
    apply: "build",
    closeBundle() {
      for (const ed of ["original", "v2", "v3"]) {
        mkdirSync(`dist/${ed}`, { recursive: true });
        copyFileSync("dist/index.html", `dist/${ed}/index.html`);
      }
    },
  };
}

// GitHub Pages serves the site from /<repo-name>/ — keep in sync with the repo name.
export default defineConfig({
  base: "/phenome-longevity-prototype/",
  plugins: [editionScope(), react(), editionPages()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
