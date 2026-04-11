"""FastAPI app — upload PDF, track progress, download result."""

from __future__ import annotations

import json
import logging
import os
import shutil
import threading
from pathlib import Path

logging.basicConfig(
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO,
)

from fastapi import FastAPI, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from pipeline import create_job, get_job, cancel_job, run_pipeline, OUTPUT_ROOT, UPLOADED_PDFS_DIR
import pipeline.orchestrator as _orch
from pipeline.template_registry import REGISTRY
from pipeline.template_registry import TEMPLATES_DIR

app = FastAPI(title="Paper-to-Video")

_default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://banim.vercel.app",
    "https://holi-hack.vercel.app",
    "https://papervideo.vercel.app",
]
_cors_origins = os.environ.get("CORS_ORIGINS", "").split(",") if os.environ.get("CORS_ORIGINS") else _default_origins


from starlette.middleware.cors import CORSMiddleware as _BaseCORS
from starlette.types import ASGIApp, Receive, Scope, Send


class _VercelCORSMiddleware(_BaseCORS):
    """CORSMiddleware that also allows any *.vercel.app preview URL."""

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            origin = headers.get(b"origin", b"").decode()
            if origin.endswith(".vercel.app") and origin not in self.allow_origins:
                self.allow_origins = {*self.allow_origins, origin}
        await super().__call__(scope, receive, send)


app.add_middleware(
    _VercelCORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.post("/upload")
async def upload_pdf(file: UploadFile, mode: str = "brief", user_email: str = ""):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file.")
    if mode not in ("brief", "detailed"):
        mode = "brief"

    # Check queue capacity
    with _orch._queue_lock:
        if len(_orch._queue_order) >= _orch.MAX_QUEUE_SIZE:
            raise HTTPException(
                503,
                "We're at capacity. Please try again in a few minutes."
            )
        _orch._queue_count += 1

    # Save uploaded PDF to a temp location outside uploaded-pdfs,
    # so create_job will run _store_pdf to deduplicate it properly.
    tmp_path = OUTPUT_ROOT / f"_tmp_{file.filename}"
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    job_id = create_job(tmp_path)
    tmp_path.unlink(missing_ok=True)

    # Tag job with user email
    job = get_job(job_id)
    if job:
        job["user_email"] = user_email

    # Track queue order
    with _orch._queue_lock:
        _orch._queue_order.append(job_id)

    # Run pipeline in background thread (waits for semaphore internally)
    t = threading.Thread(target=run_pipeline, args=(job_id,), kwargs={"plan_mode": mode}, daemon=True)
    t.start()

    return {"job_id": job_id}


@app.post("/cancel/{job_id}")
async def cancel_pipeline(job_id: str):
    if cancel_job(job_id):
        return {"status": "cancelled"}
    raise HTTPException(404, "Job not found or already completed.")


@app.get("/queue-status")
async def queue_status(job_id: str = ""):
    """Return current queue info, optionally with position for a specific job."""
    with _orch._queue_lock:
        queue_size = len(_orch._queue_order)
        position = None
        if job_id and job_id in _orch._queue_order:
            position = _orch._queue_order.index(job_id)
        return {
            "queue_size": queue_size,
            "max_queue_size": _orch.MAX_QUEUE_SIZE,
            "available": queue_size < _orch.MAX_QUEUE_SIZE,
            "position": position,
        }


@app.get("/active-jobs")
async def active_jobs(user_email: str = ""):
    """Return in-progress jobs, optionally filtered by user email."""
    from pipeline import _jobs, Status
    active = []
    for job_id, job in _jobs.items():
        status = job.get("status")
        if hasattr(status, "value"):
            status = status.value
        if status not in ("done", "failed"):
            if user_email and job.get("user_email") != user_email:
                continue
            active.append({
                "job_id": job_id,
                "status": status,
                "scenes_total": job.get("scenes_total", 0),
                "scenes_done": job.get("scenes_done", 0),
            })
    return active


@app.get("/status/{job_id}")
async def job_status(job_id: str):
    job = get_job(job_id)

    # If not in memory, try to reconstruct from disk (server may have restarted)
    if not job:
        job_dir = OUTPUT_ROOT / job_id
        if job_dir.is_dir():
            job_json = job_dir / "job.json"
            if job_json.exists():
                data = json.loads(job_json.read_text())
                if "status" in data:
                    return {
                        "status": data["status"],
                        "error": data.get("error"),
                        "scenes_total": data.get("scenes_total", 0),
                        "scenes_done": data.get("scenes_done", 0),
                        "blob_url": data.get("blob_url"),
                    }
            # Legacy fallback for old jobs without persisted status
            final = job_dir / "final.mp4"
            plan_file = job_dir / "planned_outputs" / "full_plan.json"
            scenes_total = 0
            if plan_file.exists():
                plan_data = json.loads(plan_file.read_text())
                scenes_total = len(plan_data.get("scenes", []))
            return {
                "status": "done" if final.exists() else "failed",
                "error": None,
                "scenes_total": scenes_total,
                "scenes_done": scenes_total if final.exists() else 0,
                "blob_url": None,
            }
        raise HTTPException(404, "Job not found.")

    return {
        "status": job["status"],
        "error": job["error"],
        "scenes_total": job["scenes_total"],
        "scenes_done": job["scenes_done"],
        "blob_url": job.get("blob_url"),
    }


@app.get("/job/{job_id}/data")
async def job_data(job_id: str):
    """Return extraction + plan data for the frontend viewer."""
    job = get_job(job_id)
    job_dir = OUTPUT_ROOT / job_id
    if not job and not job_dir.is_dir():
        raise HTTPException(404, "Job not found.")
    if job:
        job_dir = Path(job["job_dir"])
    result: dict = {}

    # ── Paper metadata ──
    # Try in-memory first, then extraction.json, then text.json (legacy)
    paper = job.get("paper") if job else None
    if not paper:
        ext_path = job_dir / "extraction.json"
        if ext_path.exists():
            paper = json.loads(ext_path.read_text())
    if not paper:
        text_path = job_dir / "text.json"
        if text_path.exists():
            paper = json.loads(text_path.read_text())
    if paper:
        result["paper"] = paper

    # ── Scene plan ──
    # Try in-memory first, then plan.json, then planned_outputs/full_plan.json (legacy)
    plan = job.get("plan") if job else None
    if not plan:
        plan_path = job_dir / "plan.json"
        if plan_path.exists():
            plan = json.loads(plan_path.read_text())
    if not plan:
        full_plan_path = job_dir / "planned_outputs" / "full_plan.json"
        if full_plan_path.exists():
            plan = json.loads(full_plan_path.read_text())
    if plan:
        result["plan"] = plan

    return result


def _find_video(job_id: str) -> Path:
    """Find the final video file for a job. Downloads from blob if not on disk."""
    job = get_job(job_id)
    if job and job.get("final_path"):
        p = Path(job["final_path"])
        if p.exists():
            return p
    # Check disk
    job_dir = OUTPUT_ROOT / job_id
    final = job_dir / "final.mp4"
    if final.exists():
        return final
    # Fallback: download from blob storage
    conn_str = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "")
    container = os.environ.get("AZURE_STORAGE_CONTAINER", "videos")
    if conn_str:
        try:
            from azure.storage.blob import BlobServiceClient
            blob_service = BlobServiceClient.from_connection_string(conn_str)
            blob_name = f"{job_id}/final.mp4"
            blob_client = blob_service.get_blob_client(container=container, blob=blob_name)
            job_dir.mkdir(parents=True, exist_ok=True)
            with open(final, "wb") as f:
                f.write(blob_client.download_blob().readall())
            logging.getLogger(__name__).info("Downloaded %s from blob (%d bytes)", job_id, final.stat().st_size)
            return final
        except Exception:
            pass
    raise HTTPException(404, "Video not found.")


@app.get("/stream/{job_id}")
async def stream_video(job_id: str, request: Request):
    """Serve the video with Range request support for seeking."""
    path = _find_video(job_id)
    file_size = path.stat().st_size
    range_header = request.headers.get("range")

    if range_header:
        # Parse "bytes=START-END"
        range_spec = range_header.replace("bytes=", "")
        parts = range_spec.split("-")
        start = int(parts[0])
        end = int(parts[1]) if parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        def iter_range():
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(8192, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            iter_range(),
            status_code=206,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(length),
                "Content-Type": "video/mp4",
            },
        )

    # No Range header — return full file
    return FileResponse(path, media_type="video/mp4", headers={"Accept-Ranges": "bytes"})


@app.get("/download/{job_id}")
async def download_video(job_id: str):
    """Serve the video as a download."""
    final = _find_video(job_id)
    return FileResponse(final, media_type="video/mp4", filename=f"{job_id}.mp4")


@app.get("/chapters/{job_id}")
async def get_chapters(job_id: str):
    """Return scene chapter timestamps for seek support."""
    job_dir = OUTPUT_ROOT / job_id
    chapters_file = job_dir / "chapters.json"
    if chapters_file.exists():
        return json.loads(chapters_file.read_text())
    raise HTTPException(404, "Chapters not found.")


# ── Playground API ────────────────────────────────────────────────────────────


@app.get("/api/templates")
async def list_templates():
    """Return template names grouped by category."""
    layout = []
    charts = []
    chart_names = {
        "bar_chart", "line_chart", "donut_chart",
    }
    for name, meta in REGISTRY.items():
        (charts if name in chart_names else layout).append(name)
    return {"layout": layout, "charts": charts}



# Serve frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")
