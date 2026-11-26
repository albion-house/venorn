"""The relief backend: swell a cutout into a closed 3D model.

The model keeps the painted pixels as its texture. Each part of the cutout
swells as far as it is wide, so a capsule comes out round and a horn comes out
as a cone. A depth estimate of the cutout shapes the front. The back mirrors
the front's outline, which suits things that look alike from both sides.
"""

from __future__ import annotations

import numpy as np
import trimesh
from PIL import Image
from scipy import ndimage

from . import models

NAME = "relief"
# Share of a small thing's front that the depth estimate shapes.
DEPTH_WEIGHT = 0.35


def local_radius(mask: np.ndarray) -> np.ndarray:
    """For each pixel of the mask, the radius of the largest disc that fits in the mask and covers the pixel."""
    distance = ndimage.distance_transform_edt(mask)
    result = distance.copy()
    radius = 1.5
    while radius <= distance.max():
        covered = ndimage.distance_transform_edt(distance < radius) <= radius
        result[covered & mask] = np.maximum(result[covered & mask], radius)
        radius *= 1.12
    return ndimage.gaussian_filter(result, sigma=2.0) * mask


def round_profile(mask: np.ndarray) -> np.ndarray:
    """Height in pixels that gives every part of the mask a round cross-section."""
    distance = ndimage.distance_transform_edt(mask)
    radius = np.maximum(local_radius(mask), distance)
    return np.sqrt(np.clip(distance * (2 * radius - distance), 0, None))


def _limit(height: np.ndarray, ceiling: np.ndarray | float) -> np.ndarray:
    """Hold height under a ceiling, easing into it so the surface stays smooth."""
    ceiling = np.maximum(ceiling, 1e-6)
    return ceiling * np.tanh(height / ceiling)


def _surface_plane(depth: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """The plane through the depth values that surround the mask."""
    short = min(np.ptp(np.nonzero(mask)[0]), np.ptp(np.nonzero(mask)[1])) + 1
    ring = ndimage.binary_dilation(mask, iterations=max(3, int(0.08 * short))) & ~mask
    if ring.sum() < 16:
        return np.full_like(depth, float(depth[mask].min()))
    ys, xs = np.nonzero(ring)
    design = np.stack([xs, ys, np.ones_like(xs)], axis=1).astype(np.float64)
    coefficients, *_ = np.linalg.lstsq(design, depth[ring].astype(np.float64), rcond=None)
    grid_y, grid_x = np.mgrid[0 : depth.shape[0], 0 : depth.shape[1]]
    return (coefficients[0] * grid_x + coefficients[1] * grid_y + coefficients[2]).astype(np.float32)


def thing_heights(context: Image.Image, alpha: np.ndarray, thickness: float) -> tuple[np.ndarray, np.ndarray]:
    """Front and back heights in pixels for a small thing.

    thickness is the thing's greatest depth as a fraction of its shorter side.
    """
    mask = alpha > 0.5
    ys, xs = np.nonzero(mask)
    short = min(np.ptp(ys), np.ptp(xs)) + 1
    half = _limit(round_profile(mask), thickness * short / 2)

    depth = models.depth(context)
    raised = np.clip(depth - _surface_plane(depth, mask), 0, None)
    raised[~mask] = 0
    top = float(np.percentile(raised[mask], 97))
    detail = np.clip(raised / top, 0, 1) if top > 1e-6 else np.ones_like(raised)

    front = half * (1 - DEPTH_WEIGHT + DEPTH_WEIGHT * detail)
    return ndimage.gaussian_filter(front, sigma=1.5) * mask, ndimage.gaussian_filter(half, sigma=1.5) * mask


def structure_heights(context: Image.Image, alpha: np.ndarray, thickness: float) -> tuple[np.ndarray, np.ndarray]:
    """Front and back heights in pixels for the structure, measured from its middle plane.

    thickness is half the structure's greatest depth as a fraction of its longer
    side. The back mirrors the front, as the far side of a skull mirrors the near side.
    """
    mask = alpha > 0.5
    ys, xs = np.nonzero(mask)
    long_side = max(np.ptp(ys), np.ptp(xs)) + 1

    depth = models.depth(context)
    low, high = np.percentile(depth[mask], [2, 99.5])
    detail = np.clip((depth - low) / max(high - low, 1e-6), 0, 1)

    # A floor under the depth detail gives the whole structure some body.
    relief = (0.3 + 0.7 * detail) * thickness * long_side
    half = ndimage.gaussian_filter(_limit(round_profile(mask), relief), sigma=1.0) * mask
    return half, half


def build_mesh(
    texture: Image.Image,
    front: np.ndarray,
    anchor: tuple[float, float],
    cells: int,
    back: np.ndarray | None = None,
    rest_on_back: bool = False,
) -> tuple[trimesh.Trimesh, float]:
    """Turn height maps into a textured mesh.

    The model's longer side is 1, the anchor pixel is the origin in x and y,
    +x is right, +y is up and +z faces the viewer. With a back height map the
    mesh is closed: the front rises to +z and the back falls to -z from the
    plane z = 0. rest_on_back then moves the model up so its lowest point sits
    at z = 0. Returns the mesh and the pixel-to-model scale.
    """
    alpha = np.asarray(texture)[..., 3]
    rows, columns = alpha.shape
    mask = alpha > 127
    ys, xs = np.nonzero(mask)
    scale = 1.0 / (max(np.ptp(ys), np.ptp(xs)) + 1)

    step = max(rows, columns) / cells
    grid_x = np.linspace(0, columns - 1, max(2, round(columns / step) + 1))
    grid_y = np.linspace(0, rows - 1, max(2, round(rows / step) + 1))
    sample_x = np.round(grid_x).astype(int)
    sample_y = np.round(grid_y).astype(int)

    # The mesh reaches one cell past the outline. The texture's alpha channel draws the outline itself.
    covered = ndimage.maximum_filter(mask, size=int(np.ceil(step)) | 1)[np.ix_(sample_y, sample_x)]
    covered = ndimage.binary_dilation(covered, iterations=1)

    index = np.full(covered.shape, -1, dtype=np.int64)
    count = int(covered.sum())
    index[covered] = np.arange(count)
    grid_row, grid_column = np.nonzero(covered)
    px, py = grid_x[grid_column], grid_y[grid_row]
    uv = np.stack([px / (columns - 1), 1 - py / (rows - 1)], axis=1)

    a, b = index[:-1, :-1], index[:-1, 1:]
    c, d = index[1:, :-1], index[1:, 1:]
    whole = (a >= 0) & (b >= 0) & (c >= 0) & (d >= 0)
    toward_viewer = np.concatenate(
        [np.stack([a[whole], c[whole], b[whole]], axis=1), np.stack([b[whole], c[whole], d[whole]], axis=1)]
    )

    def side(height: np.ndarray, facing: float) -> tuple[np.ndarray, np.ndarray]:
        smooth = ndimage.gaussian_filter(height, sigma=max(step / 2, 0.5))
        z = smooth[np.ix_(sample_y, sample_x)]
        slope_y, slope_x = np.gradient(z, grid_y, grid_x)
        vertices = np.stack(
            [(px - anchor[0]) * scale, (anchor[1] - py) * scale, facing * z[grid_row, grid_column] * scale], axis=1
        )
        normals = np.stack(
            [-slope_x[grid_row, grid_column], slope_y[grid_row, grid_column], np.full(count, facing)], axis=1
        )
        return vertices, normals / np.linalg.norm(normals, axis=1, keepdims=True)

    vertices, normals = side(front, 1.0)
    faces = toward_viewer
    if back is not None:
        back_vertices, back_normals = side(back, -1.0)
        if rest_on_back:
            lift = -back_vertices[:, 2].min()
            vertices[:, 2] += lift
            back_vertices[:, 2] += lift
        vertices = np.concatenate([vertices, back_vertices])
        normals = np.concatenate([normals, back_normals])
        uv = np.concatenate([uv, uv])
        faces = np.concatenate([toward_viewer, toward_viewer[:, ::-1] + count])

    material = trimesh.visual.material.PBRMaterial(
        baseColorTexture=texture,
        metallicFactor=0.0,
        roughnessFactor=0.85,
        alphaMode="MASK",
        alphaCutoff=0.5,
        doubleSided=True,
    )
    mesh = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        vertex_normals=normals,
        visual=trimesh.visual.TextureVisuals(uv=uv, material=material),
        process=False,
    )
    return mesh, scale
