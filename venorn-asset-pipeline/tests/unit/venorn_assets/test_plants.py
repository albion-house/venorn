import numpy as np
import pytest

from venorn_assets import plants

BASE = (14, 70, 25)
LEAF = (150, 170, 40)
PETAL = (235, 235, 235)


@pytest.fixture
def meadow() -> tuple[np.ndarray, np.ndarray]:
    """Two stems on a dark green base. The left stem carries a round flower head that leans over the right stem."""
    image = np.full((120, 200, 3), BASE, dtype=np.uint8)
    ground = np.ones((120, 200), dtype=bool)
    image[30:120, 58:63] = LEAF
    image[60:120, 138:143] = LEAF
    grid_y, grid_x = np.mgrid[0:120, 0:200]
    image[(grid_x - 80) ** 2 + (grid_y - 30) ** 2 < 28**2] = PETAL
    image[40:45, 100:140] = LEAF
    return image, ground


def test_dark_base_is_cut_away_and_the_plants_stay(meadow):
    image, ground = meadow

    cutout = plants.cut_out(image, ground)

    assert cutout[100, 60] and cutout[100, 140] and cutout[30, 80]
    assert not cutout[100, 100]
    assert not cutout[5, 5]


def test_base_color_is_the_color_that_was_cut_away(meadow):
    image, ground = meadow

    color = plants.base_color(image, ground, plants.cut_out(image, ground))

    assert tuple(int(v) for v in color) == BASE


def test_each_root_grows_one_plant(meadow):
    image, ground = meadow

    labels = plants.split(plants.cut_out(image, ground))

    assert labels[110, 60] != labels[110, 140]
    assert labels[110, 60] > 0 and labels[110, 140] > 0
    assert labels[5, 5] == 0


def test_flower_head_stays_whole_where_two_plants_meet(meadow):
    image, ground = meadow
    cutout = plants.cut_out(image, ground)

    labels = plants.split(cutout)

    grid_y, grid_x = np.mgrid[0:120, 0:200]
    head = (grid_x - 80) ** 2 + (grid_y - 30) ** 2 < 24**2
    assert len(np.unique(labels[head])) == 1


def test_plants_are_cut_out_tallest_first_with_their_roots(meadow):
    image, ground = meadow

    grown = plants.plants(image, plants.cut_out(image, ground))

    assert len(grown) == 2
    assert grown[0].height * grown[0].width >= grown[1].height * grown[1].width
    for plant in grown:
        assert plant.picture.mode == "RGBA"
        assert plant.picture.size == (plant.width * plants.ENLARGE, plant.height * plants.ENLARGE)
        assert 0 <= plant.root <= 1
    # The stem of the second plant runs straight up the middle of its picture's lower edge.
    assert grown[1].root == pytest.approx(0.5, abs=0.2)
