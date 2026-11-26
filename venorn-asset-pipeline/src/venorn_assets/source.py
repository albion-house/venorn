"""A source image and the things to look for in it, read from source.toml."""

from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

ROLES = ("pinned", "printed")


def project_root() -> Path:
    """The venorn-asset-pipeline directory."""
    override = os.environ.get("VENORN_ASSETS_ROOT")
    if override:
        return Path(override).resolve()
    return Path(__file__).resolve().parents[2]


FINDERS = ("detector", "painted")


@dataclass(frozen=True)
class Kind:
    id: str
    role: str
    # How instances are found: by the detector and classifier, or by their paint on the structure.
    find: str = "detector"
    prompt: str = ""
    looks_like: str = ""
    # For a painted kind: the hue range of its paint in degrees, and the kinds it may carry.
    hue: tuple[float, float] | None = None
    carries: tuple[str, ...] = ()
    exemplars: int = 1
    thickness: float = 0.3
    criteria: dict = field(default_factory=dict)


@dataclass(frozen=True)
class Structure:
    id: str
    prompts: tuple[str, ...]
    thickness: float = 0.15


@dataclass(frozen=True)
class Scene:
    ground_id: str
    far_id: str
    far_hue: tuple[float, float]
    far_distance: float
    floating_id: str
    floating_distance: float
    floating_motion: str
    backdrop_id: str


@dataclass(frozen=True)
class Source:
    name: str
    title: str
    image_url: str
    image_sha256: str
    structure: Structure
    kinds: tuple[Kind, ...]
    scene: Scene | None
    root: Path

    @property
    def cache_dir(self) -> Path:
        return self.root / ".cache" / "sources" / self.name

    @property
    def image_path(self) -> Path:
        suffix = Path(self.image_url).suffix or ".jpg"
        return self.cache_dir / f"image{suffix}"

    @property
    def build_dir(self) -> Path:
        return self.root / "build" / self.name

    def stage_dir(self, stage: str) -> Path:
        path = self.build_dir / stage
        path.mkdir(parents=True, exist_ok=True)
        return path

    def kind(self, kind_id: str) -> Kind:
        for kind in self.kinds:
            if kind.id == kind_id:
                return kind
        raise KeyError(f"source {self.name} has no kind named {kind_id}")


def load_source(name: str, root: Path | None = None) -> Source:
    root = root or project_root()
    path = root / "sources" / name / "source.toml"
    if not path.exists():
        known = sorted(p.parent.name for p in (root / "sources").glob("*/source.toml"))
        raise SystemExit(f"No source named {name}. Known sources: {', '.join(known) or 'none'}")
    data = tomllib.loads(path.read_text())

    kinds = []
    for entry in data.get("kinds", []):
        if entry["role"] not in ROLES:
            raise SystemExit(f"{path}: kind {entry['id']} has role {entry['role']}; use one of {ROLES}")
        find = entry.get("find", "detector")
        if find not in FINDERS:
            raise SystemExit(f"{path}: kind {entry['id']} is found by {find}; use one of {FINDERS}")
        prompt = entry.get("prompt", "").lower()
        if find == "detector" and not prompt:
            raise SystemExit(f"{path}: kind {entry['id']} needs a prompt for the detector")
        if find == "painted" and "hue" not in entry:
            raise SystemExit(f"{path}: kind {entry['id']} needs the hue range of its paint")
        kinds.append(
            Kind(
                id=entry["id"],
                role=entry["role"],
                find=find,
                prompt=prompt,
                looks_like=entry.get("looks_like", f"a {prompt}"),
                hue=tuple(float(v) for v in entry["hue"]) if "hue" in entry else None,
                carries=tuple(entry.get("carries", ())),
                exemplars=int(entry.get("exemplars", 1)),
                thickness=float(entry.get("thickness", 0.3)),
                criteria=entry.get("criteria", {}),
            )
        )

    scene = None
    if "scene" in data:
        declared = data["scene"]
        scene = Scene(
            ground_id=declared["ground"]["id"],
            far_id=declared["far"]["id"],
            far_hue=tuple(float(v) for v in declared["far"]["hue"]),
            far_distance=float(declared["far"]["distance"]),
            floating_id=declared["floating"]["id"],
            floating_distance=float(declared["floating"]["distance"]),
            floating_motion=declared["floating"].get("motion", "still"),
            backdrop_id=declared["backdrop"]["id"],
        )

    structure = data["structure"]
    return Source(
        name=data["name"],
        title=data.get("title", data["name"]),
        image_url=data["image"]["url"],
        image_sha256=data["image"]["sha256"],
        structure=Structure(
            id=structure["id"],
            prompts=tuple(p.lower() for p in structure["prompts"]),
            thickness=float(structure.get("thickness", 0.15)),
        ),
        kinds=tuple(kinds),
        scene=scene,
        root=root,
    )
