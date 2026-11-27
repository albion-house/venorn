import json

import numpy as np
from PIL import Image

from venorn_assets.export import ORIGINAL, export, smaller_original
from venorn_assets.source import load_source


def _source_with_a_built_structure(root, work: str, size: tuple[int, int]):
    """A source with no kinds and no scene, whose earlier stages have written what the export reads."""
    declared = root / "sources" / "stone"
    declared.mkdir(parents=True)
    (declared / "source.toml").write_text(
        f"""
name = "stone"
{work}
[image]
url = "https://example.com/stone.jpg"
sha256 = "0"
description = "A grey stone."
[structure]
id = "stone"
prompts = ["stone"]
"""
    )
    source = load_source("stone", root=root)
    pixels = np.random.default_rng(1).integers(0, 255, size=(size[1], size[0], 3)).astype(np.uint8)
    source.image_path.parent.mkdir(parents=True)
    Image.fromarray(pixels).save(source.image_path)
    (source.stage_dir("catalog") / "catalog.json").write_text(json.dumps({"instances": []}))
    (source.stage_dir("isolated") / "isolated.json").write_text(json.dumps({"features": []}))
    (source.stage_dir("models") / "structure.json").write_text(
        json.dumps(
            {
                "id": "stone",
                "model": "structure.glb",
                "painted": "structure-painted.png",
                "thickness": 0.2,
                "origin": [0, 0],
                "scale": 1.0,
            }
        )
    )
    return source


def test_painting_source_names_its_work():
    source = load_source("veneration-ornamentation")

    assert source.title == "Veneration, Ornamentation"
    assert source.artist == "Fawnicorn"
    assert source.page == "https://fawnicorn.com/personal-art/veneration-ornamentation/"
    assert source.image_description


def test_export_writes_the_work_and_a_smaller_copy_of_its_image(tmp_path, monkeypatch):
    work = 'title = "Stone, Still"\nartist = "Someone"\npage = "https://example.com/stone/"'
    source = _source_with_a_built_structure(tmp_path, work, (1086, 1536))
    monkeypatch.setenv("VENORN_ASSETS_EXPORT_DIR", str(tmp_path / "out"))

    export(source)

    out = tmp_path / "out" / "stone"
    manifest = json.loads((out / "manifest.json").read_text())
    assert (manifest["title"], manifest["artist"], manifest["page"]) == (
        "Stone, Still",
        "Someone",
        "https://example.com/stone/",
    )
    assert manifest["original"]["image"] == ORIGINAL
    assert manifest["original"]["description"] == "A grey stone."
    with Image.open(out / ORIGINAL) as copy:
        assert copy.format == "JPEG"
        assert copy.size == (manifest["original"]["width"], manifest["original"]["height"])
        assert copy.height == 1200
        assert abs(copy.width / copy.height - 1086 / 1536) < 0.002


def test_export_without_an_artist_or_a_page(tmp_path, monkeypatch):
    source = _source_with_a_built_structure(tmp_path, "", (300, 200))
    monkeypatch.setenv("VENORN_ASSETS_EXPORT_DIR", str(tmp_path / "out"))

    export(source)

    manifest = json.loads((tmp_path / "out" / "stone" / "manifest.json").read_text())
    assert manifest["title"] == "stone"
    assert manifest["artist"] is None and manifest["page"] is None


def test_small_image_keeps_its_size(tmp_path):
    path = tmp_path / "small.png"
    Image.new("RGB", (640, 480), (200, 120, 40)).save(path)

    assert smaller_original(path).size == (640, 480)
