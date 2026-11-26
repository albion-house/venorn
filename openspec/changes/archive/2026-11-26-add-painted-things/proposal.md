## Why

The painting has plants that look painted onto the bone: stems and leaves that lie flat, with flowers that stand out from them. codekiln wants to put those on the skull as well as the pinned things.

## What Changes

The pipeline finds every thing with a detector and makes each a solid model held on a pin. This change adds a second way to find and place a thing:

- A kind can be found by its paint. The pipeline takes the patches of the skull that carry paint in a declared hue range, which for the painting is the yellow-green of the stems and leaves.
- A flower that sits on painted stems joins them. It leaves the catalog as a pinned flower and becomes part of the painted plant.
- A painted plant's model lies nearly flat where the paint is and rises where the flowers are.
- The viewer lays a painted plant on the surface with no pin. Depth sets how far its flowers stand out, and Bend curves it.

The painting gives eleven painted plants, called sprigs, and seven of them become models.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-pipeline`: a kind can be found by its paint and can carry instances of other kinds.
- `asset-viewer`: a painted thing lies on the surface with its flowers standing out.

## Impact

- `venorn-asset-pipeline/` gains a painted finder in the catalog stage, and `source.toml` gains the `find`, `hue` and `carries` fields for a kind.
- The catalog lists 13 pinned flowers where it listed 27, because 14 joined sprigs.
- An exported asset set grows from 20 MB to 22 MB.

## Citations

- [My/Principle/Declarative over Imperative](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Declarative%20over%20Imperative.md)
- [My/Principle/Simplify/Create Uniform Interfaces](https://github.com/codekiln/logseq-encode-garden/blob/main/pages/My___Principle___Simplify___Create%20Uniform%20Interfaces.md)
