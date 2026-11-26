import numpy as np

from venorn_assets.features import locate
from venorn_assets.source import Feature, load_source


def test_painting_names_a_socket_and_a_horn():
    features = load_source("veneration-ornamentation").structure.features

    assert [(feature.id, feature.shape) for feature in features] == [("socket", "hollow"), ("horn", "spike")]


def test_hollow_is_the_middle_of_its_box():
    mask = np.ones((100, 100), dtype=bool)

    place = locate(Feature("socket", "hole", "hollow"), (40, 50, 60, 80), mask)

    assert place["center"] == [50.0, 65.0]
    assert place["radius"] == 10.0


def test_spike_runs_from_where_it_joins_the_structure_to_its_far_end():
    # A wide body along the bottom, with a thin spike rising from its left part to the top.
    mask = np.zeros((120, 200), dtype=bool)
    mask[80:120, :] = True
    mask[0:80, 38:43] = True

    place = locate(Feature("horn", "horn", "spike"), (30, 0, 50, 85), mask)

    assert place["tip"][1] == 0.0
    assert 38 <= place["tip"][0] <= 42
    assert place["base"][1] > 70
    assert 30 <= place["base"][0] <= 50
