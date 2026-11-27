// The part of Vite's import.meta.env that the client reads. Vite is a mise
// tool, so its own type declarations are outside node_modules.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The version the About screen shows, which vite.config.ts writes in. __VENORN_BUILT__ is the build's
// date in UTC, and empty from the dev server. Each is empty when it is not known.
declare const __VENORN_COMMIT__: string;
declare const __VENORN_BUILT__: string;
declare const __VENORN_ASSETS_TAG__: string;
