import jsonschema
import pytest

from venorn_assets.criteria import criteria_for, validate


@pytest.fixture
def measured() -> dict:
    return {
        "item_id": "candy-01",
        "kind": "candy",
        "model": "candy-01.glb",
        "size": {"natural": 0.07, "aspect": 1.8, "thickness": 0.2},
        "overrides": {},
        "source": {"image": "a-painting", "instance": "candy-004", "box": [10, 20, 90, 60], "angle": 12.5},
        "lift": {"backend": "relief", "models": ["a-depth-model"]},
    }


def test_pinned_thing_stands_off_the_surface_on_a_visible_pin(measured):
    record = criteria_for(role="pinned", **measured)

    assert record["attach"]["mode"] == "pin"
    assert record["attach"]["pin"]["visible"] is True
    assert record["attach"]["standoff"]["max"] > 0
    assert record["adjust"]["bend"]["enabled"] is False


def test_printed_thing_lies_in_the_surface_and_bends(measured):
    record = criteria_for(role="printed", **measured)

    assert record["attach"]["mode"] == "print"
    assert record["attach"]["pin"]["visible"] is False
    assert record["adjust"]["conform"] == {"default": 1.0, "min": 1.0, "max": 1.0}
    assert record["adjust"]["bend"]["enabled"] is True
    assert record["adjust"]["bend"]["curve"] == "cubic-bezier"


def test_kind_overrides_replace_only_the_fields_they_name(measured):
    measured["overrides"] = {"adjust": {"scale": {"max": 4.0}}}
    record = criteria_for(role="pinned", **measured)

    assert record["adjust"]["scale"] == {"default": 1.0, "min": 0.5, "max": 4.0}
    assert record["adjust"]["spin"]["max"] == 180.0


def test_overrides_leave_the_role_defaults_unchanged(measured):
    measured["overrides"] = {"adjust": {"scale": {"max": 4.0}}}
    criteria_for(role="pinned", **measured)
    measured["overrides"] = {}

    assert criteria_for(role="pinned", **measured)["adjust"]["scale"]["max"] == 2.5


def test_record_missing_a_field_fails_validation(measured):
    record = criteria_for(role="pinned", **measured)
    del record["adjust"]["spin"]

    with pytest.raises(jsonschema.ValidationError):
        validate(record)


def test_every_model_can_be_made_deeper_or_pressed_flat(measured):
    for role in ("pinned", "printed"):
        depth = criteria_for(role=role, **measured)["adjust"]["depth"]
        assert depth["min"] < depth["default"] < depth["max"]


def test_fold_is_offered_only_to_a_kind_that_declares_it(measured):
    assert "fold" not in criteria_for(role="pinned", **measured)["adjust"]

    measured["overrides"] = {"adjust": {"fold": {"default": 28.0, "min": 0.0, "max": 70.0}}}
    assert criteria_for(role="pinned", **measured)["adjust"]["fold"]["default"] == 28.0


def test_kind_can_override_how_it_attaches(measured):
    measured["overrides"] = {"attach": {"standoff": {"default": 0.03, "min": 0.0, "max": 0.4}}}
    record = criteria_for(role="pinned", **measured)

    assert record["attach"]["standoff"]["default"] == 0.03
    assert record["attach"]["pin"]["visible"] is True
