"""FastAPI app — upload PDF, track progress, download result."""

from __future__ import annotations

import shutil
import threading
from pathlib import Path

from fastapi import FastAPI, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from pipeline import create_job, get_job, run_pipeline, OUTPUT_ROOT
from template_registry import REGISTRY, TemplateMeta
from template_engine import prepare_scene_html_web, TEMPLATES_DIR

app = FastAPI(title="Paper-to-Video")


@app.post("/upload")
async def upload_pdf(file: UploadFile):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file.")

    # Save uploaded PDF
    job_id = create_job(Path("pending"))  # placeholder, will overwrite path
    job_dir = OUTPUT_ROOT / job_id
    pdf_path = job_dir / file.filename
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Update job with real path
    job = get_job(job_id)
    job["pdf_path"] = str(pdf_path)

    # Run pipeline in background thread
    t = threading.Thread(target=run_pipeline, args=(job_id,), daemon=True)
    t.start()

    return {"job_id": job_id}


@app.get("/status/{job_id}")
async def job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return {
        "status": job["status"],
        "error": job["error"],
        "scenes_total": job["scenes_total"],
        "scenes_done": job["scenes_done"],
    }


@app.get("/download/{job_id}")
async def download_video(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] != "done":
        raise HTTPException(409, f"Job is not done yet (status: {job['status']}).")
    final = Path(job["final_path"])
    if not final.exists():
        raise HTTPException(500, "Output file missing.")
    return FileResponse(final, media_type="video/mp4", filename="paper_video.mp4")


# ── Playground API ────────────────────────────────────────────────────────────


@app.get("/api/templates")
async def list_templates():
    """Return template names grouped by category."""
    layout = []
    charts = []
    chart_names = {
        "bar_chart", "grouped_bar_chart", "horizontal_bar_chart",
        "line_chart", "scatter_plot", "pie_donut_chart", "heatmap",
    }
    for name, meta in REGISTRY.items():
        (charts if name in chart_names else layout).append(name)
    return {"layout": layout, "charts": charts}


@app.post("/api/template-preview/{name}")
async def template_preview(name: str, request: Request):
    """Render a template with the provided JSON data for browser preview."""
    if name not in REGISTRY:
        raise HTTPException(404, f"Unknown template: {name}")
    data = await request.json()
    html = prepare_scene_html_web(REGISTRY[name], data)
    return {"html": html}


@app.get("/api/theme.css")
async def serve_theme_css():
    """Serve theme.css for iframe previews."""
    css_path = TEMPLATES_DIR / "theme.css"
    if not css_path.exists():
        raise HTTPException(404, "theme.css not found")
    return FileResponse(css_path, media_type="text/css")


# Serve frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")
