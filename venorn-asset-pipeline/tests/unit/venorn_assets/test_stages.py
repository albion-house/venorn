import numpy as np
import pytest

from venorn_assets import bare, layers
from venorn_assets.catalog import TILE, _principal_angle, _tiles
from venorn_assets.isolate import bleed_edges
from venorn_assets.source import load_source


def test_painting_source_names_its_structure_and_kinds():
    source = load_source("veneration-ornamentation")

    assert source.structure.id == "skull"
    assert {kind.id for kind in source.kinds} == {"butterfly", "candy", "capsule", "bead", "flower", "sprig"}
    assert {kind.id for kind in source.kinds if kind.role == "printed"} == {"sprig"}
    assert source.kind("butterfly").criteria["adjust"]["fold"]["default"] > 0


def test_painting_groups_its_kinds_into_five_categories():
    source = load_source("veneration-ornamentation")

    assert [category.id for category in source.categories] == ["butterflies", "candies", "pills", "jewels", "flowers"]
    assert source.categories[-1].kinds == ("flower", "sprig")


def test_painted_kind_names_its_paint_and_what_it_carries():
    sprig = load_source("veneration-ornamentation").kind("sprig")

    assert sprig.find == "painted"
    assert sprig.hue == (44.0, 170.0)
    assert sprig.carries == ("flower",)
    assert load_source("veneration-ornamentation").kind("candy").find == "detector"


def test_detector_kind_without_a_prompt_is_refused(tmp_path):
    declared = tmp_path / "sources" / "broken"
    declared.mkdir(parents=True)
    (declared / "source.toml").write_text(
        """
name = "broken"
[image]
url = "https://example.com/a.jpg"
sha256 = "0"
[structure]
id = "rock"
prompts = ["rock"]
[[kinds]]
id = "shell"
role = "pinned"
"""
    )

    with pytest.raises(SystemExit, match="needs a prompt"):
        load_source("broken", root=tmp_path)


def test_painting_source_declares_its_scene_layers():
    scene = load_source("veneration-ornamentation").scene

    assert (scene.ground_id, scene.floating_id, scene.far_id, scene.backdrop_id) == (
        "meadow",
        "clouds",
        "forest",
        "sky",
    )
    assert scene.far_distance > scene.floating_distance > 0


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


@pytest.fixture
def scene_picture() -> tuple[np.ndarray, np.ndarray]:
    """A sky that runs from blue down to pink at row 60, with a speckled blue patch floating in it."""
    rows = np.linspace(0, 1, 100)[:, None]
    top, horizon = np.array([20, 90, 160]), np.array([240, 200, 205])
    sky = top + (horizon - top) * np.clip(rows / 0.6, 0, 1)[..., None]
    image = np.repeat(sky, 160, axis=1).astype(np.uint8)
    random = np.random.default_rng(7)
    patch = np.zeros((100, 160), dtype=bool)
    patch[20:40, 50:110] = True
    image[patch] = random.integers(0, 255, size=(int(patch.sum()), 1)) * np.array([0.2, 0.5, 1.0])
    return image, patch


def test_flat_sky_is_told_from_a_textured_patch(scene_picture):
    image, patch = scene_picture
    everything = np.ones(patch.shape, dtype=bool)

    flat = layers.find_flat(image, everything)

    assert not flat[patch].any()
    assert flat[70:95, 10:150].all()


def test_backdrop_follows_the_sky_to_the_horizon_and_holds_below_it(scene_picture):
    image, patch = scene_picture
    flat = layers.find_flat(image, np.ones(patch.shape, dtype=bool))

    backdrop = layers.fit_backdrop(image, flat)

    assert np.abs(backdrop[2] - image[2, 0]).max() < 12
    assert np.abs(backdrop[60] - (240, 200, 205)).max() < 12
    assert np.allclose(backdrop[75], backdrop[99])


def test_textured_blue_patch_floats(scene_picture):
    image, patch = scene_picture
    everything = np.ones(patch.shape, dtype=bool)
    no_ground = np.zeros(patch.shape, dtype=bool)

    floating, ground, leftover = layers.find_floating(image, everything, layers.find_flat(image, everything), no_ground)

    assert floating[25:35, 60:100].all()
    assert not floating[70:95].any()
    assert not ground.any() and not leftover.any()


def test_far_layer_carries_on_behind_the_structure():
    """Two tree masses with the structure standing between them and rising above them."""
    far = np.zeros((200, 300), dtype=bool)
    far[80:, :100] = True
    far[80:, 200:] = True
    in_front = np.zeros_like(far)
    in_front[40:200, 100:200] = True
    nothing = np.zeros_like(far)

    extent = layers.far_extent(far, nothing, in_front)

    assert extent[80:, :].all()
    assert not extent[:75, :].any()


def test_far_layer_keeps_its_pixels_along_the_sides_of_the_image():
    mask = np.zeros((40, 40), dtype=bool)
    mask[10:, :] = True

    assert layers._close(mask, 2)[10:, [0, -1]].all()


def test_top_edge_dips_where_the_layer_has_a_gap():
    """Two hills with a valley between them."""
    mask = np.zeros((100, 300), dtype=bool)
    mask[30:, :100] = True
    mask[70:, 100:200] = True
    mask[40:, 200:] = True

    edge = layers.top_edge(mask, 7)

    assert [column for column, _ in edge] == [0, 50, 100, 150, 199, 249, 299]
    assert [row for _, row in edge][:2] == [30, 30]
    assert edge[3][1] == 70
    assert [row for _, row in edge][-2:] == [40, 40]
