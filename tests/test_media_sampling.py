"""Real FFmpeg regression for absolute-time sampling after a seek."""

import shutil
import subprocess

import pytest

from frameseek.media import frames, probe


def test_seek_window_keeps_all_decoded_absolute_timestamps(tmp_path):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        pytest.skip("FFmpeg required")
    source = tmp_path / "source.mp4"
    subprocess.run(
        [
            ffmpeg,
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=64x64:rate=10",
            "-t",
            "20",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(source),
        ],
        check=True,
        timeout=20,
    )
    source.rename(tmp_path / "original")
    metadata = probe(tmp_path)
    sampled = frames(tmp_path, "vid_test", metadata, {"start": 12.0, "end": 18.0}, 6, "late")
    assert len(sampled) == 6
    assert [item["t"] for item in sampled] == pytest.approx([12, 13, 14, 15, 16, 17], abs=0.11)
    assert all((tmp_path / "frames" / item["file"]).is_file() for item in sampled)
