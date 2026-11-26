// A relative base lets the built site load from any path, such as
// https://albion-house.github.io/venorn/.

// Vite answers a request only when it names a host Vite knows: this Mac, or an
// address. The phone task lists this Mac's Tailscale names here, so a phone can
// open the game by name.
const names = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
  .VENORN_ALLOWED_HOSTS;

export default {
  base: "./",
  build: { target: "es2022" },
  server: { port: 5183, strictPort: true },
  preview: { allowedHosts: (names ?? "").split(",").filter(Boolean) },
};
