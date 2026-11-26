"""Download a source image and check it against the recorded checksum."""

from __future__ import annotations

import hashlib
import urllib.request

from .source import Source


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(source: Source) -> None:
    path = source.image_path
    if path.exists() and _sha256(path.read_bytes()) == source.image_sha256:
        print(f"fetch: {path} is already downloaded")
        return

    request = urllib.request.Request(source.image_url, headers={"User-Agent": "venorn-assets"})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()

    digest = _sha256(data)
    if digest != source.image_sha256:
        raise SystemExit(
            f"fetch: {source.image_url} has sha256 {digest}, "
            f"but source.toml records {source.image_sha256}. "
            "Update source.toml if the image was changed on purpose."
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(f"fetch: saved {path}")
