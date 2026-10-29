// Publish dist/ to the gh-pages branch (GitHub Pages source). Run via `npm run deploy`.
import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const sh = (cmd, cwd = "dist") => execSync(cmd, { cwd, stdio: "inherit" });
const remote = execSync("git remote get-url origin").toString().trim();

rmSync("dist/.git", { recursive: true, force: true }); // fresh history each deploy (vite keeps .git in outDir)
writeFileSync("dist/.nojekyll", ""); // serve files/folders starting with "_" as-is
sh("git init -q -b gh-pages");
sh("git add -A");
sh('git -c user.name="deploy" -c user.email="deploy@users.noreply.github.com" commit -q -m "deploy: build from main"');
sh(`git push -f ${remote} gh-pages`);
console.log("pushed dist/ → gh-pages");
