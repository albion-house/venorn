## 1. Finding painted things

- [x] 1.1 Let a kind declare that it is found by its paint, with a hue range and the kinds it carries. Verify: unit tests load the sprig kind and refuse a detector kind with no prompt.
- [x] 1.2 Find the painted patches of the structure, leaving out other things, the outline's margin and dark holes. Verify: a unit test finds one stem with its flower and leaves out a candy and a hole.
- [x] 1.3 Join carried things to the paint they sit on and drop them from the catalog. Verify: a unit test keeps a flower that stands apart and drops one on a stem, and the catalog lists 11 sprigs and 13 flowers.

## 2. Models

- [x] 2.1 Keep the paint nearly flat in a painted model, so the carried things stand out. Verify: a unit test checks that the flat half of a disc stays under a third of the height of the other half.
- [x] 2.2 Give each painted model its own size from the painting. Verify: the exported sprigs have natural sizes from 0.07 to 0.13.

## 3. In the viewer

- [x] 3.1 Place a sprig from the tray and check its controls. Verify: a placed sprig has no pin and offers Size, Turn, Depth, Bend and Mirror.
- [x] 3.2 Check that the stems lie on the bone and the flowers stand out. Verify: with a jaw sprig at size 1.6, its highest point is 0.079 world units off the bone at depth 1 and its lowest 0.004, and at depth 3 the highest is 0.228.
- [x] 3.3 Check Bend and "Arrange as painted". Verify: Bend moves a vertex by 0.418 world units, and the arrangement places 22 sprigs across both sides.
