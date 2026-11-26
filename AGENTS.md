# Agent instructions

venorn is a browser game about adorning a skull in a meadow. `README.md` describes the game and the repository layout. `STATUS.md` says what is built, what is waiting on codekiln and what is not built yet. Update it when that changes.

## Tools and tasks

- mise manages every tool, environment variable and task. The root `mise.toml` turns on monorepo mode, and each project directory has its own `mise.toml` and `mise-tasks/`.
- Run a project's task as `mise //<directory>:<task>`. `mise tasks --all` lists them.
- Write a new task as a file in the project's `mise-tasks/` directory, with a `#MISE description` line and `#USAGE` lines for its flags and arguments.
- Python dependencies go in `venorn-asset-pipeline/pyproject.toml` and are locked with `uv lock`. JavaScript dependencies go in `venorn-game-client/package.json` and are installed with aube.

## Changes

- Propose behavior changes as an OpenSpec change under `openspec/changes/<change-name>/` before implementing them. `openspec/config.yaml` holds the rules for writing proposals, designs, specs and tasks.
- Put a throwaway prototype for a change in `openspec/changes/<change-name>/experiments/<experiment-name>/` with a `README.md` that says what it is for and how to run it.
- Work on a branch in a git worktree under `.worktrees/`, named after the issue it resolves, and open a pull request.

## Source art and generated assets

- Source images are declared by URL and checksum in `venorn-asset-pipeline/sources/<name>/source.toml`. The pipeline downloads them into `venorn-asset-pipeline/.cache/`, which git ignores.
- The pipeline writes its output to `venorn-asset-pipeline/build/` and exports finished asset sets to `venorn-game-client/public/assets/`. Git ignores both directories.
- Each pipeline stage writes a picture for a person to check: `catalog/overlay.png`, `isolated/sheet.png`, `layers/check.png` and `layers/plants.png` under `build/<source>/`. Look at them after changing a stage.
- A browser stops drawing a page it is not showing. To check the viewer from a script, call `window.venorn.hold(true)` to stop the page drawing by itself, then `window.venorn.draw(seconds)` for each frame, and read the canvas.
