import numpy as np
import pytest
from PIL import Image

from venorn_assets import models, painted, relief
from venorn_assets.catalog import add_painted
from venorn_assets.source import Kind

BONE = (236, 216, 178)
STEM = (150, 170, 40)
PETAL = (210, 40, 60)
SHADE = (10, 60, 20)


@pytest.fixture
def bone() -> dict[str, np.ndarray]:
    """A slab of bone with a painted stem that ends in a flower, a candy off to one side, and a dark hole."""
    image = np.full((160, 240, 3), BONE, dtype=np.uint8)
    structure = np.zeros((160, 240), dtype=bool)
    structure[10:150, 10:230] = True
    grid_y, grid_x = np.mgrid[0:160, 0:240]

    image[60:130, 78:83] = STEM
    image[90:95, 60:100] = STEM
    flower = (grid_x - 80) ** 2 + (grid_y - 45) ** 2 < 14**2
    image[flower] = PETAL
    candy = (grid_x - 180) ** 2 + (grid_y - 60) ** 2 < 12**2
    image[candy] = PETAL
    stray = (grid_x - 190) ** 2 + (grid_y - 120) ** 2 < 10**2
    image[stray] = PETAL
    image[120:140, 130:160] = SHADE
    return {"image": image, "structure": structure, "flower": flower, "candy": candy, "stray": stray}


def test_stem_and_the_flower_it_carries_are_one_painted_thing(bone):
    found = painted.find_painted(
        bone["image"], bone["structure"], (44, 170), bone["flower"] | bone["stray"], bone["candy"]
    )

    assert len(found) == 1
    thing = found[0]
    assert thing[100, 80] and thing[92, 70]
    assert thing[45, 80]


def test_other_things_and_dark_holes_are_left_out(bone):
    found = painted.find_painted(
        bone["image"], bone["structure"], (44, 170), bone["flower"] | bone["stray"], bone["candy"]
    )

    thing = found[0]
    assert not thing[60, 180]
    assert not thing[120, 190]
    assert not thing[130, 145]


def test_flower_on_a_stem_is_carried_and_a_flower_apart_is_not(bone):
    found = painted.find_painted(
        bone["image"], bone["structure"], (44, 170), bone["flower"] | bone["stray"], bone["candy"]
    )

    assert painted.carried_by(bone["flower"], found)
    assert not painted.carried_by(bone["stray"], found)


def test_catalog_adds_the_painted_thing_and_drops_the_flower_it_carries(bone):
    sprig = Kind(id="sprig", role="printed", find="painted", hue=(44.0, 170.0), carries=("flower",))
    things = [
        ("flower", 0.6, (66.0, 31.0, 94.0, 59.0), bone["flower"], 0.9, 1.0),
        ("flower", 0.6, (180.0, 110.0, 200.0, 130.0), bone["stray"], 0.9, 1.0),
        ("candy", 0.5, (168.0, 48.0, 192.0, 72.0), bone["candy"], 0.9, 1.0),
    ]

    things = add_painted(bone["image"], bone["structure"], [sprig], things)

    assert sorted(kind for kind, *_ in things) == ["candy", "flower", "sprig"]
    box = next(thing[2] for thing in things if thing[0] == "sprig")
    assert box[1] < 35 and box[3] > 125


def test_flat_parts_stay_low_and_the_rest_stands_out(monkeypatch):
    """A wide disc, half of it marked flat."""
    monkeypatch.setattr(models, "depth", lambda image: np.zeros((image.height, image.width), dtype=np.float32))
    grid_y, grid_x = np.mgrid[0:100, 0:160]
    alpha = (((grid_x - 80) / 70) ** 2 + ((grid_y - 50) / 40) ** 2 < 1).astype(np.float32)
    flat = np.zeros((100, 160), dtype=bool)
    flat[:, :80] = True
    context = Image.fromarray(np.zeros((100, 160, 3), dtype=np.uint8))

    front, _ = relief.thing_heights(context, alpha, 0.6, flat)

    assert front[50, 120] > 3 * front[50, 40]
    assert front[50, 40] > 0
