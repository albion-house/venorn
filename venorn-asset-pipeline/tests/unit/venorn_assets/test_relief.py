import numpy as np
import pytest
from PIL import Image

from venorn_assets import relief


@pytest.fixture
def disc() -> tuple[Image.Image, np.ndarray]:
    """A red disc, wider than it is tall, on a transparent card, and a dome-shaped height map for it."""
    rows, columns = 80, 120
    grid_y, grid_x = np.mgrid[0:rows, 0:columns]
    reach = ((grid_x - 60) / 50) ** 2 + ((grid_y - 40) / 30) ** 2
    inside = reach < 1
    pixels = np.zeros((rows, columns, 4), dtype=np.uint8)
    pixels[inside] = (200, 30, 30, 255)
    height = np.where(inside, 10 * np.sqrt(np.clip(1 - reach, 0, 1)), 0).astype(np.float32)
    return Image.fromarray(pixels), height


def test_longer_side_of_the_model_is_one_unit(disc):
    texture, height = disc
    mesh, scale = relief.build_mesh(texture, height, anchor=(60, 40), cells=40)

    alpha = np.asarray(texture)[..., 3] > 127
    width = np.ptp(np.nonzero(alpha)[1]) + 1
    assert scale == pytest.approx(1 / width)
    # The mesh reaches a cell past the outline, so it is a little over one unit wide.
    assert 1.0 <= np.ptp(mesh.vertices[:, 0]) < 1.15


def test_anchor_pixel_is_the_origin_and_the_dome_rises_toward_the_viewer(disc):
    texture, height = disc
    mesh, scale = relief.build_mesh(texture, height, anchor=(60, 40), cells=40)

    nearest = np.argmin(np.linalg.norm(mesh.vertices[:, :2], axis=1))
    assert np.linalg.norm(mesh.vertices[nearest, :2]) < 0.03
    assert mesh.vertices[nearest, 2] == pytest.approx(mesh.vertices[:, 2].max(), rel=0.05)
    assert mesh.vertices[:, 2].min() >= 0
    assert mesh.vertices[:, 2].max() == pytest.approx(10 * scale, rel=0.15)


def test_faces_face_the_viewer_and_normals_are_unit_length(disc):
    texture, height = disc
    mesh, _ = relief.build_mesh(texture, height, anchor=(60, 40), cells=40)

    assert len(mesh.faces) > 0
    assert (mesh.face_normals[:, 2] > 0).all()
    assert np.allclose(np.linalg.norm(mesh.vertex_normals, axis=1), 1.0)


def test_texture_coordinates_stay_on_the_texture(disc):
    texture, height = disc
    mesh, _ = relief.build_mesh(texture, height, anchor=(60, 40), cells=40)

    assert mesh.visual.uv.min() >= 0
    assert mesh.visual.uv.max() <= 1


def test_model_exports_as_binary_gltf(disc, tmp_path):
    texture, height = disc
    mesh, _ = relief.build_mesh(texture, height, anchor=(60, 40), cells=40)

    path = tmp_path / "disc.glb"
    mesh.export(path)
    assert path.read_bytes()[:4] == b"glTF"
