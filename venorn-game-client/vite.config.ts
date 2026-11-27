import { execSync } from "node:child_process";

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
  },
});
