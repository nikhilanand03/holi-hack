"""Pipeline orchestrator — chains all stages and tracks job status."""

from __future__ import annotations

import uuid
from enum import Enum
from pathlib import Path
from typing import Any

from stage1_extract import extract_pdf
from stage2_planner import plan_scenes
from stage4_render import render_scenes
from stage5_tts import synthesize_all
from stage6_assembly import assemble

OUTPUT_ROOT = Path(__file__).parent / "output"


class Status(str, Enum):
    QUEUED = "queued"
    EXTRACTING = "extracting"
    PLANNING = "planning"
    RENDERING = "rendering"
    SYNTHESIZING_TTS = "synthesizing_tts"
    ASSEMBLING = "assembling"
    DONE = "done"
    FAILED = "failed"


# In-memory job store (sufficient for single-process uvicorn)
_jobs: dict[str, dict[str, Any]] = {}


def create_job(pdf_path: Path) -> str:
    job_id = uuid.uuid4().hex[:12]
    job_dir = OUTPUT_ROOT / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    _jobs[job_id] = {
        "status": Status.QUEUED,
        "pdf_path": str(pdf_path),
        "job_dir": str(job_dir),
        "error": None,
        "scenes_total": 0,
        "scenes_done": 0,
    }
    return job_id


def get_job(job_id: str) -> dict[str, Any] | None:
    return _jobs.get(job_id)


def run_pipeline(job_id: str) -> None:
    """Execute the full pipeline. Intended to run in a background thread."""
    job = _jobs[job_id]
    job_dir = Path(job["job_dir"])

    try:
        # Stage 1 — Extract PDF
        job["status"] = Status.EXTRACTING
        paper = extract_pdf(job["pdf_path"])

        # Stage 2 — Plan scenes (LLM picks templates + data)
        job["status"] = Status.PLANNING
        plan = plan_scenes(paper)
        job["scenes_total"] = len(plan.scenes)

        # Stage 4 — Render templates to frames (Stage 3 eliminated)
        job["status"] = Status.RENDERING
        frames_dir = job_dir / "frames"
        render_results = render_scenes(plan.scenes, frames_dir)
        job["scenes_done"] = len(render_results)

        # Stage 5 — TTS
        job["status"] = Status.SYNTHESIZING_TTS
        audio_dir = job_dir / "audio"
        narrations = [s.narration for s in plan.scenes]
        mp3_paths = synthesize_all(narrations, audio_dir)

        # Stage 6 — Assembly
        job["status"] = Status.ASSEMBLING
        final = assemble(render_results, mp3_paths, job_dir)
        job["final_path"] = str(final)
        job["status"] = Status.DONE

    except Exception as exc:
        job["status"] = Status.FAILED
        job["error"] = str(exc)
