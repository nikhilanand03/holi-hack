"""Stage 6: Assemble PNGs + MP3s into a final MP4 using ffmpeg."""

from __future__ import annotations

import subprocess
from pathlib import Path


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[:500]}")


def _get_audio_duration(mp3_path: Path) -> float:
    """Get duration of an audio file in seconds via ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(mp3_path),
        ],
        capture_output=True, text=True,
    )
    return float(result.stdout.strip())


def make_scene_clip(
    png_path: Path, mp3_path: Path, out_path: Path, fallback_duration: float = 8.0
) -> Path:
    """Create a video clip: still image held for audio duration + audio track."""
    duration = _get_audio_duration(mp3_path)
    if duration <= 0:
        duration = fallback_duration

    _run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(png_path),
        "-i", str(mp3_path),
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", str(duration),
        "-shortest",
        str(out_path),
    ])
    return out_path


def concatenate_clips(clip_paths: list[Path], output_path: Path) -> Path:
    """Concatenate scene clips into a single MP4."""
    list_file = output_path.parent / "concat_list.txt"
    list_file.write_text(
        "\n".join(f"file '{p.resolve()}'" for p in clip_paths),
        encoding="utf-8",
    )

    _run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(list_file),
        "-c", "copy",
        str(output_path),
    ])
    list_file.unlink(missing_ok=True)
    return output_path


def assemble(
    png_paths: list[Path],
    mp3_paths: list[Path],
    output_dir: Path,
) -> Path:
    """Full assembly: scene clips → final MP4."""
    clips_dir = output_dir / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    clip_paths: list[Path] = []
    for i, (png, mp3) in enumerate(zip(png_paths, mp3_paths)):
        clip = clips_dir / f"clip_{i:03d}.mp4"
        make_scene_clip(png, mp3, clip)
        clip_paths.append(clip)

    final = output_dir / "final.mp4"
    concatenate_clips(clip_paths, final)
    return final
