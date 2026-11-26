// The part of Vite's import.meta.env that the client reads. Vite is a mise
// tool, so its own type declarations are outside node_modules.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
