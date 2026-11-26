"""The open-weights models the pipeline runs, loaded once per process."""

from __future__ import annotations

import os
from functools import cache

import numpy as np
import torch
from PIL import Image

# Each id names a model on Hugging Face. All four are Apache-2.0 licensed and
# download without an account.
DETECTOR_ID = "IDEA-Research/grounding-dino-base"
CLASSIFIER_ID = "google/siglip2-base-patch16-224"
SEGMENTER_ID = "facebook/sam-vit-base"
DEPTH_ID = "depth-anything/Depth-Anything-V2-Small-hf"


def accelerator() -> str:
    override = os.environ.get("VENORN_ASSETS_DEVICE")
    if override:
        return override
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


@cache
def _detector():
    from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor

    processor = AutoProcessor.from_pretrained(DETECTOR_ID)
    # Grounding DINO uses operators the Apple GPU backend lacks, so it runs on the CPU.
    device = "cuda" if accelerator() == "cuda" else "cpu"
    model = AutoModelForZeroShotObjectDetection.from_pretrained(DETECTOR_ID).to(device).eval()
    return processor, model, device


@cache
def _classifier():
    from transformers import AutoModel, AutoProcessor

    processor = AutoProcessor.from_pretrained(CLASSIFIER_ID)
    model = AutoModel.from_pretrained(CLASSIFIER_ID).eval()
    return processor, model


@cache
def _segmenter():
    from transformers import SamModel, SamProcessor

    processor = SamProcessor.from_pretrained(SEGMENTER_ID)
    device = accelerator()
    model = SamModel.from_pretrained(SEGMENTER_ID).to(device).eval()
    return processor, model, device


@cache
def _depth():
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation

    processor = AutoImageProcessor.from_pretrained(DEPTH_ID)
    device = accelerator()
    model = AutoModelForDepthEstimation.from_pretrained(DEPTH_ID).to(device).eval()
    return processor, model, device


def detect(
    image: Image.Image, prompts: list[str], threshold: float, text_threshold: float
) -> list[tuple[str, float, tuple[float, float, float, float]]]:
    """Find things named by the prompts. Returns (prompt, score, box) with the box in image pixels."""
    processor, model, device = _detector()
    text = " . ".join(prompts) + " ."
    inputs = processor(images=image, text=text, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    result = processor.post_process_grounded_object_detection(
        outputs,
        inputs.input_ids,
        threshold=threshold,
        text_threshold=text_threshold,
        target_sizes=[image.size[::-1]],
    )[0]
    labels = result.get("text_labels", result.get("labels"))

    found = []
    for label, score, box in zip(labels, result["scores"].tolist(), result["boxes"].tolist(), strict=True):
        prompt = _match_prompt(str(label), prompts)
        if prompt is not None:
            found.append((prompt, float(score), tuple(float(v) for v in box)))
    return found


def _match_prompt(label: str, prompts: list[str]) -> str | None:
    """The detector can return a phrase that merges two prompts. Keep a label only when it names one prompt."""
    label = label.strip().lower()
    if label in prompts:
        return label
    matches = [p for p in prompts if p in label]
    return matches[0] if len(matches) == 1 else None


def classify(images: list[Image.Image], descriptions: list[str]) -> np.ndarray:
    """Score each image against each description. Returns probabilities shaped (images, descriptions)."""
    if not images:
        return np.zeros((0, len(descriptions)), dtype=np.float32)
    processor, model = _classifier()
    inputs = processor(text=descriptions, images=images, padding="max_length", max_length=64, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.logits_per_image.softmax(dim=1).numpy()


def segment(image: Image.Image, boxes: list[tuple[float, float, float, float]]) -> tuple[np.ndarray, list[float]]:
    """Outline the thing inside each box.

    Returns boolean masks shaped (n, height, width) and a quality score for each.
    """
    if not boxes:
        return np.zeros((0, image.height, image.width), dtype=bool), []
    processor, model, device = _segmenter()
    inputs = processor(images=image, input_boxes=[[list(box) for box in boxes]], return_tensors="pt")
    original_sizes = inputs.pop("original_sizes")
    reshaped_sizes = inputs.pop("reshaped_input_sizes")
    # The Apple GPU backend has no float64, which the processor uses for box coordinates.
    inputs = {k: (v.to(torch.float32) if v.is_floating_point() else v).to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs, multimask_output=False)
    masks = processor.post_process_masks(outputs.pred_masks.cpu(), original_sizes, reshaped_sizes)[0]
    scores = outputs.iou_scores.cpu()[0, :, 0].tolist()
    return masks[:, 0].numpy().astype(bool), [float(s) for s in scores]


def depth(image: Image.Image) -> np.ndarray:
    """Estimate relative depth. Returns a float array shaped (height, width) where larger values are nearer."""
    processor, model, device = _depth()
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    result = processor.post_process_depth_estimation(outputs, target_sizes=[(image.height, image.width)])[0]
    return result["predicted_depth"].cpu().numpy().astype(np.float32)
