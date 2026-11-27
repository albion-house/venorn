// The service worker keeps the game on the device after the first visit, so it opens without downloading
// the models again, and opens offline. The page registers it only in a built site, as
// sw.js?assets=<release tag>-<checksum of the asset set's files>.
//
// - The asset set under assets/<set>/ comes from a cache once it is downloaded. The cache is named after
//   the asset set, so a new asset set brings a new worker, which deletes the caches of older ones.
// - The page itself comes from the network when there is one, so a new build shows at once, and from the
//   cache offline.
// - Vite's built scripts and styles under assets/ never change under one name, so they come from the
//   cache. Each new copy of the page names the ones it uses, and the cache drops the others.
// - Other files of the site, such as the web app manifest and the icons, come from the network when there
//   is one, and from the cache offline.

const SET = "veneration-ornamentation";
const KEY = new URL(self.location.href).searchParams.get("assets") || "unnamed";
// Other sites on the same origin, such as other GitHub Pages projects, have caches of their own, so every
// name starts with the game's.
const ASSET_CACHE = `venorn-assets-${KEY}`;
const SHELL_CACHE = "venorn-shell";
const SCOPE = self.registration.scope;
const SET_URL = new URL(`assets/${SET}/`, SCOPE).href;
const BUILT_URL = new URL("assets/", SCOPE).href;
// The asset set is downloaded this many files at a time.
const AT_ONCE = 4;

self.addEventListener("install", (event) => {
  event.waitUntil(keepPage().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("venorn-assets-") && name !== ASSET_CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

// The page asks for the whole asset set once the worker is running. Files it has already are skipped.
self.addEventListener("message", (event) => {
  if (event.data === "keep-assets") event.waitUntil(keepAssetSet());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  const address = url.origin + url.pathname;
  if (!address.startsWith(SCOPE)) return;
  if (request.mode === "navigate") event.respondWith(page(event));
  else if (address.startsWith(SET_URL)) event.respondWith(cacheFirst(event, ASSET_CACHE, address));
  else if (address.startsWith(BUILT_URL)) event.respondWith(cacheFirst(event, SHELL_CACHE, address));
  else event.respondWith(networkFirst(event, address));
});

/** The page from the network, kept for offline use, or the kept copy when the network fails. */
async function page(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok) event.waitUntil(keepPage(response.clone(), false));
    return response;
  } catch (error) {
    const kept = await caches.match(SCOPE, { cacheName: SHELL_CACHE });
    if (kept) return kept;
    throw error;
  }
}

/**
 * Keep a copy of the page, and drop the built files that no copy of the page names any more. When the
 * worker installs, the page was loaded before the worker could see it, so its built files are fetched too.
 */
async function keepPage(response, withFiles = true) {
  const cache = await caches.open(SHELL_CACHE);
  response ??= await fetch(SCOPE, { cache: "no-cache" });
  if (!response.ok) return;
  await cache.put(SCOPE, response.clone());
  const named = builtFiles(await response.text());
  if (withFiles) {
    await Promise.all(
      named.map(async (address) => {
        if (await cache.match(address)) return;
        const file = await fetch(address);
        if (file.ok) await cache.put(address, file);
      }),
    );
  }
  for (const request of await cache.keys()) {
    if (request.url.startsWith(BUILT_URL) && !named.includes(request.url)) await cache.delete(request);
  }
}

/** The addresses of the built scripts and styles a copy of the page names. */
function builtFiles(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], SCOPE).href)
    .filter((address) => address.startsWith(BUILT_URL) && !address.startsWith(SET_URL));
}

/** A file from the cache, or from the network and then kept. */
async function cacheFirst(event, name, address) {
  const cache = await caches.open(name);
  const kept = await cache.match(address, { ignoreVary: true });
  if (kept) return kept;
  // The browser's own cache may still hold a file of the last asset set for a few minutes, so the server
  // is asked whether it changed.
  const response = await fetch(address, { cache: name === ASSET_CACHE ? "no-cache" : "default" });
  if (response.status === 200) event.waitUntil(cache.put(address, response.clone()));
  return response;
}

/** A file from the network, kept for offline use, or the kept copy when the network fails. */
async function networkFirst(event, address) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(event.request);
    if (response.status === 200) event.waitUntil(cache.put(address, response.clone()));
    return response;
  } catch (error) {
    const kept = await cache.match(address, { ignoreVary: true });
    if (kept) return kept;
    throw error;
  }
}

/** Download every file the asset set's manifest names that is not kept yet. */
async function keepAssetSet() {
  const cache = await caches.open(ASSET_CACHE);
  const manifestUrl = `${SET_URL}manifest.json`;
  let manifest = await cache.match(manifestUrl);
  if (!manifest) {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (!response.ok) return;
    await cache.put(manifestUrl, response.clone());
    manifest = response;
  }
  const files = new Set();
  const collect = (value) => {
    if (typeof value === "string" && /\.(glb|gltf|bin|png|jpe?g|webp|ktx2|json)$/i.test(value)) {
      const address = new URL(value, SET_URL).href;
      if (address.startsWith(SET_URL)) files.add(address);
    } else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(await manifest.json());
  const queue = [...files];
  const next = async () => {
    for (let address = queue.shift(); address; address = queue.shift()) {
      if (await cache.match(address)) continue;
      try {
        const response = await fetch(address, { cache: "no-cache" });
        if (response.status === 200) await cache.put(address, response);
      } catch {
        // Offline or interrupted. The page's own request, or the next visit, fetches it.
      }
    }
  };
  await Promise.all(Array.from({ length: AT_ONCE }, next));
}
