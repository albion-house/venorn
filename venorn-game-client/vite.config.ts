import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// A relative base lets the built site load from any path, such as
// https://albion-house.github.io/venorn/.

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

// Vite answers a request only when it names a host Vite knows: this Mac, or an
// address. The phone task lists this Mac's Tailscale names here, so a phone can
// open the game by name.
const names = env.VENORN_ALLOWED_HOSTS;

// The commit the site is built from. The Pages workflow names it in GITHUB_SHA.
function commit(): string {
  if (env.GITHUB_SHA) return env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

// A short checksum of the asset set that fetch-assets or the pipeline put in
// public/assets/. The service worker keeps the asset set under the release tag
// and this checksum, so it downloads the set again after a new release, and
// after the pipeline exports a changed set on this Mac under the same tag.
function assetSum(): string {
  const hash = createHash("sha256");
  const add = (path: string, name: string): void => {
    if (statSync(path).isDirectory()) {
      for (const entry of readdirSync(path).sort()) add(join(path, entry), `${name}/${entry}`);
    } else {
      hash.update(name);
      hash.update(readFileSync(path));
    }
  };
  try {
    add(fileURLToPath(new URL("public/assets", import.meta.url)), "");
  } catch {
    return "none";
  }
  return hash.digest("hex").slice(0, 12);
}

export default ({ command }: { command: "build" | "serve" }) => ({
  base: "./",
  build: { target: "es2022" },
  server: { port: 5183, strictPort: true },
  preview: { allowedHosts: (names ?? "").split(",").filter(Boolean) },
  // The version the About screen shows: the commit, the day of the build in UTC, and the asset set's
  // release, which mise sets from this directory's mise.toml. The dev server has no build day.
  define: {
    __VENORN_COMMIT__: JSON.stringify(commit()),
    __VENORN_BUILT__: JSON.stringify(command === "build" ? new Date().toISOString().slice(0, 10) : ""),
    __VENORN_ASSETS_TAG__: JSON.stringify(env.VENORN_ASSETS_TAG ?? ""),
    // The dev server registers no service worker, so it skips reading the asset set.
    __VENORN_ASSETS_SUM__: JSON.stringify(command === "build" ? assetSum() : ""),
  },
});
