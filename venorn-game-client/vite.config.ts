// A relative base lets the built site load from any path, such as
// https://albion-house.github.io/venorn/.
export default {
  base: "./",
  build: { target: "es2022" },
  server: { port: 5183, strictPort: true },
};
