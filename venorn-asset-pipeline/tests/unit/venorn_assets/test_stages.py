import numpy as np
import pytest

from venorn_assets import bare
from venorn_assets.catalog import TILE, _principal_angle, _tiles
from venorn_assets.isolate import bleed_edges
from venorn_assets.source import load_source


def test_painting_source_names_its_structure_and_kinds():
    source = load_source("veneration-ornamentation")

    assert source.structure.id == "skull"
    assert {kind.id for kind in source.kinds} == {"butterfly", "candy", "capsule", "bead", "flower"}
    assert source.kind("flower").role == "printed"
    assert source.kind("candy").role == "pinned"


def test_unknown_source_is_reported_with_the_known_ones():
    with pytest.raises(SystemExit, match="veneration-ornamentation"):
        load_source("no-such-painting")


def test_tiles_cover_the_whole_image():
    width, height = 1086, 1536
    covered = np.zeros((height, width), dtype=bool)
    for x0, y0, x1, y1 in _tiles(width, height):
        assert x1 - x0 <= TILE and y1 - y0 <= TILE
        covered[y0:y1, x0:x1] = True

    assert covered.all()


def test_long_axis_angle_follows_the_shape():
    flat = np.zeros((40, 40), dtype=bool)
    flat[18:22, 5:35] = True
    upright = flat.T
    rising = np.eye(40, dtype=bool)[::-1]

    assert _principal_angle(flat) == pytest.approx(0, abs=1)
    assert abs(_principal_angle(upright)) == pytest.approx(90, abs=1)
    assert _principal_angle(rising) == pytest.approx(45, abs=1)


def test_edge_color_spreads_into_the_transparent_area():
    pixels = np.zeros((20, 20, 4), dtype=np.uint8)
    pixels[8:12, 8:12] = (200, 100, 50, 255)

    spread = bleed_edges(pixels)

    assert tuple(spread[6, 6, :3]) == (200, 100, 50)
    assert (spread[..., 3] == pixels[..., 3]).all()


def test_vivid_marks_on_plain_bone_are_found_and_filled():
    bone = (236, 216, 178)
    image = np.full((60, 60, 3), bone, dtype=np.uint8)
    image[25:35, 25:35] = (210, 30, 40)
    structure = np.ones((60, 60), dtype=bool)
    nothing_cataloged = np.zeros((60, 60), dtype=bool)

    additions = bare.find_additions(image, structure, nothing_cataloged)
    filled = bare.fill(image, additions, structure)

    assert additions[30, 30]
    assert not additions[5, 5]
    assert np.abs(filled[30, 30].astype(int) - bone).max() <= 2
    assert tuple(filled[5, 5]) == bone
