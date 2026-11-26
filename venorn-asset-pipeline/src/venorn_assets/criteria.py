"""Adjustment criteria: how a model attaches and how far a player may change it.

schemas/adjustment.schema.json describes every field.
"""

from __future__ import annotations

import copy
import json
from functools import cache

import jsonschema

from .source import project_root

ROLE_DEFAULTS = {
    "pinned": {
        "attach": {
            "mode": "pin",
            "anchor": [0.0, 0.0, 0.0],
            "standoff": {"default": 0.12, "min": 0.0, "max": 0.6},
            "pin": {"visible": True},
        },
        "adjust": {
            "scale": {"default": 1.0, "min": 0.5, "max": 2.5},
            "spin": {"default": 0.0, "min": -180.0, "max": 180.0},
            "tilt": {"default": 0.0, "min": 0.0, "max": 30.0},
            "depth": {"default": 1.0, "min": 0.1, "max": 1.6},
            "conform": {"default": 0.0, "min": 0.0, "max": 0.3},
            "bend": {"enabled": False},
            "mirror": True,
        },
    },
    "printed": {
        "attach": {
            "mode": "print",
            "anchor": [0.0, 0.0, 0.0],
            "standoff": {"default": 0.0, "min": 0.0, "max": 0.0},
            "pin": {"visible": False},
        },
        "adjust": {
            "scale": {"default": 1.0, "min": 0.4, "max": 3.0},
            "spin": {"default": 0.0, "min": -180.0, "max": 180.0},
            "tilt": {"default": 0.0, "min": 0.0, "max": 0.0},
            "depth": {"default": 1.0, "min": 0.2, "max": 3.0},
            "conform": {"default": 1.0, "min": 1.0, "max": 1.0},
            "bend": {"enabled": True, "curve": "cubic-bezier", "max": 0.5},
            "mirror": True,
        },
    },
}


def _merge(base: dict, overrides: dict) -> dict:
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            _merge(base[key], value)
        else:
            base[key] = value
    return base


def criteria_for(
    *, item_id: str, kind: str, role: str, model: str, size: dict, overrides: dict, source: dict, lift: dict
) -> dict:
    """Start from the role's defaults, apply the kind's overrides from source.toml, and add what was measured."""
    record = {"id": item_id, "kind": kind, "role": role, "model": model, "size": size}
    record.update(_merge(copy.deepcopy(ROLE_DEFAULTS[role]), overrides))
    record["source"] = source
    record["lift"] = lift
    validate(record)
    return record


@cache
def _schema() -> dict:
    return json.loads((project_root() / "schemas" / "adjustment.schema.json").read_text())


def validate(record: dict) -> None:
    jsonschema.validate(record, _schema())
