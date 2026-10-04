"""Pure window planning on original-video seconds; never truncate the tail."""

import math
from bisect import bisect_right
from dataclasses import dataclass
from itertools import pairwise


@dataclass(frozen=True)
class Window:
    index: int
    start: float
    end: float


def plan_windows(duration: float, scene_boundaries: tuple[float, ...] = ()) -> list[Window]:
    if (
        type(duration) not in (int, float)
        or not math.isfinite(duration)
        or not 0 < duration <= 3600
    ):
        raise ValueError("duration must be finite and between 0 and 3600 seconds")
    boundaries = tuple(scene_boundaries)
    if len(boundaries) > 10000:
        raise ValueError("scene boundary list exceeds finite admission limit")
    if any(
        type(t) not in (int, float) or not math.isfinite(t) or not 0 < t < duration
        for t in boundaries
    ):
        raise ValueError("scene boundaries must be finite and inside the video")
    if any(b <= a for a, b in pairwise(boundaries)):
        raise ValueError("scene boundaries must be strictly increasing")
    result: list[Window] = []
    start = 0.0
    while start < duration:
        hard_end = min(start + 120, duration)
        # A cut must advance by more than overlap, or a short scene could stall the loop.
        cut_index = bisect_right(boundaries, hard_end) - 1
        cut = boundaries[cut_index] if cut_index >= 0 else 0
        end = cut if cut > start + 5 else hard_end
        result.append(Window(len(result), start, end))
        if end == duration:
            break
        start = end - 5
    return result
