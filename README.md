# venorn

A calm browser game about adorning a skull in a meadow. The player pins candies, capsules, butterflies, beads and flowers to a unicorn skull and paints on it, building a small shrine that ends up looking like a poster.

The game takes its look from the Fawnicorn painting [Veneration Ornamentation](https://fawnicorn.com/assets/art/veneration-ornamentation.jpg): a decorated skull lying in a flowering meadow, with a forest and curling clouds behind it.

## Layout

| Directory | What it holds |
| --- | --- |
| `venorn-asset-pipeline/` | Python pipeline that turns a source image into 3D models, each with adjustment criteria |
| `venorn-game-client/` | TypeScript and three.js web client. Its build output is the future GitHub Pages site |
| `openspec/` | Specs, and the change proposals that precede each piece of work |

## Setting up

Install [mise](https://mise.jdx.dev/), then from the repository root:

```sh
mise trust
mise install --monorepo
```

## Tasks

List every task with `mise tasks --all`.

```sh
# Turn the source image into models and adjustment criteria
mise //venorn-asset-pipeline:build

# Look at the models in a browser
mise //venorn-game-client:dev
```

## Working on venorn

Each piece of work starts as an OpenSpec change under `openspec/changes/`. Read `AGENTS.md` before changing the repository.
