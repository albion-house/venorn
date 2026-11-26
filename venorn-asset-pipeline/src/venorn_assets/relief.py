"""The relief backend: raise a cutout into a shallow 3D model seen from the front.

The front of the model keeps the painted pixels as its texture. Its height
comes from a depth estimate of the cutout, blended with a rounded profile
that swells from the outline toward the middle.
"""

from __future__ import annotations

import numpy as np
import trimesh
from PIL import Image
from scipy import ndimage

from . import models

NAME = "relief"
# Share of the height that comes from the depth estimate. The rest is the rounded profile.
DEPTH_WEIGHT = 0.4


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


def thing_height(context: Image.Image, alpha: np.ndarray, thickness: float) -> np.ndarray:
    """Height in pixels for a small thing that sits on a surface."""
    mask = alpha > 0.5
    ys, xs = np.nonzero(mask)
    short = min(np.ptp(ys), np.ptp(xs)) + 1

    depth = models.depth(context)
    raised = np.clip(depth - _surface_plane(depth, mask), 0, None)
    raised[~mask] = 0
    top = float(np.percentile(raised[mask], 97))
    detail = np.clip(raised / top, 0, 1) if top > 1e-6 else np.zeros_like(raised)

    distance = ndimage.distance_transform_edt(mask)
    reach = np.clip(distance / max(distance.max(), 1.0), 0, 1)
    rounded = np.sqrt(1 - (1 - reach) ** 2)
    # The depth detail fades out at the outline so the model meets the surface there.
    edge = np.clip(distance / max(0.08 * short, 1.0), 0, 1)

    height = ((1 - DEPTH_WEIGHT) * rounded + DEPTH_WEIGHT * detail * edge) * thickness * short
    return ndimage.gaussian_filter(height, sigma=1.5) * mask


def structure_height(context: Image.Image, alpha: np.ndarray, thickness: float) -> np.ndarray:
    """Height in pixels for the structure, which fills most of its image."""
    mask = alpha > 0.5
    ys, xs = np.nonzero(mask)
    long_side = max(np.ptp(ys), np.ptp(xs)) + 1

    depth = models.depth(context)
    low, high = np.percentile(depth[mask], [2, 99.5])
    detail = np.clip((depth - low) / max(high - low, 1e-6), 0, 1)

    distance = ndimage.distance_transform_edt(mask)
    rim = np.clip(distance / (0.02 * long_side), 0, 1)
    rim = np.sqrt(1 - (1 - rim) ** 2)

    # A floor under the depth detail gives the whole structure some body.
    height = (0.25 + 0.75 * detail) * rim * thickness * long_side
    return ndimage.gaussian_filter(height, sigma=1.0) * mask


def build_mesh(
    texture: Image.Image, height: np.ndarray, anchor: tuple[float, float], cells: int
) -> tuple[trimesh.Trimesh, float]:
    """Turn a height map into a textured mesh.

    The model's longer side is 1, the anchor pixel is the origin, +x is right,
    +y is up and +z faces the viewer. Returns the mesh and the pixel-to-model scale.
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

    smooth = ndimage.gaussian_filter(height, sigma=max(step / 2, 0.5))
    z = smooth[np.ix_(sample_y, sample_x)]
    slope_y, slope_x = np.gradient(z, grid_y, grid_x)

    index = np.full(covered.shape, -1, dtype=np.int64)
    index[covered] = np.arange(int(covered.sum()))
    grid_row, grid_column = np.nonzero(covered)
    px, py = grid_x[grid_column], grid_y[grid_row]

    vertices = np.stack([(px - anchor[0]) * scale, (anchor[1] - py) * scale, z[grid_row, grid_column] * scale], axis=1)
    normals = np.stack([-slope_x[grid_row, grid_column], slope_y[grid_row, grid_column], np.ones(len(px))], axis=1)
    normals /= np.linalg.norm(normals, axis=1, keepdims=True)
    uv = np.stack([px / (columns - 1), 1 - py / (rows - 1)], axis=1)

    a, b = index[:-1, :-1], index[:-1, 1:]
    c, d = index[1:, :-1], index[1:, 1:]
    whole = (a >= 0) & (b >= 0) & (c >= 0) & (d >= 0)
    faces = np.concatenate(
        [np.stack([a[whole], c[whole], b[whole]], axis=1), np.stack([b[whole], c[whole], d[whole]], axis=1)]
    )

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
