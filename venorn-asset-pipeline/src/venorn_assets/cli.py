"""Command line entry point: venorn-assets <stage> <source>."""

from __future__ import annotations

import argparse

from .source import load_source

STAGES = ("fetch", "catalog", "isolate", "lift", "export")


def run_stage(stage: str, source_name: str) -> None:
    source = load_source(source_name)
    if stage == "fetch":
        from .fetch import fetch

        fetch(source)
    elif stage == "catalog":
        from .catalog import catalog

        catalog(source)
    elif stage == "isolate":
        from .isolate import isolate

        isolate(source)
    elif stage == "lift":
        from .lift import lift

        lift(source)
    elif stage == "export":
        from .export import export

        export(source)


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="venorn-assets",
        description="Turn a source image into 3D models with adjustment criteria.",
    )
    parser.add_argument("stage", choices=(*STAGES, "build"), help="the stage to run; build runs every stage in order")
    parser.add_argument("source", help="name of a directory under sources/")
    args = parser.parse_args()

    for stage in STAGES if args.stage == "build" else (args.stage,):
        run_stage(stage, args.source)


if __name__ == "__main__":
    main()
