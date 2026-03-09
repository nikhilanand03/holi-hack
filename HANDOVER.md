# HANDOVER - 2026-03-09

## Summary

This session focused on deploying the PaperVideo platform to production (Vercel + Azure), adding test suites, and optimizing the video generation pipeline for speed. The frontend is a React+Vite SPA at `platform/` deployed to Vercel, the backend is a FastAPI app in a Docker container on Azure Container Apps (4 CPU, 8GB RAM), and the pipeline now renders scenes and assembles video clips in parallel.

---

## What Got Done

### 1. Video Player — Chapters Embedded in Progress Bar
- Moved the chapter-segmented progress bar from below the video into the player's bottom control overlay (YouTube-style)
- Segments use translucent white on the dark gradient, expand on hover, show tooltip with scene name + timestamp
- Current scene name displayed in the controls row next to timestamp
- `platform/src/app/pages/Viewer.tsx:396-490`

### 2. Fullscreen Support
- Wired the `<Maximize>` button to `requestFullscreen()` on the video container
- Added `f`/`F` keyboard shortcut for toggling fullscreen
- Tracks fullscreen state via `fullscreenchange` event listener
- `platform/src/app/pages/Viewer.tsx:56-73`

### 3. UX Polish — Hover/Cursor, Upload Confirmation
- "Generate Video" button: `cursor-pointer` when enabled, `not-allowed` when disabled, hover brightness + shadow
- Example paper buttons: `cursor-pointer` + hover shadow
- PDF upload drop zone: green checkmark, "PDF uploaded successfully" message, green border when file selected
- `platform/src/app/pages/Home.tsx:207-225` (button), `126-175` (drop zone)

### 4. Backend Deployed to Azure Container Apps
- **Dockerfile** created for FastAPI + Playwright + Chromium + ffmpeg
- **Azure Container Registry** (`banimcr.azurecr.io`) for Docker images — builds in-cloud via `az acr build`
- **Azure Container Apps** with 4 CPU, 8GB RAM, scale-to-zero (replaces old B1 App Service)
- All env vars set: Azure OpenAI, TTS, Blob Storage, Reducto API key, CORS origins
- Backend URL: `https://banim-api.yellowdune-6510dc56.eastus.azurecontainerapps.io`
- Old App Service and plan deleted to stop costs

### 5. Frontend Deployed to Vercel
- Vercel project `banim` under `spunkymartians-projects` account
- `VITE_API_URL` env var points to Azure Container Apps backend
- Frontend `api.ts` uses `VITE_API_URL` as base for all API calls (empty string in dev = Vite proxy)
- `vercel.json` with SPA rewrites, `vite-env.d.ts` for TypeScript `import.meta.env` support
- Test files excluded from production TS build via `tsconfig.json` exclude

### 6. CORS Updated for Production
- `app.py` CORS now includes `https://banim.vercel.app` by default
- Supports `CORS_ORIGINS` env var for custom origins
- `app.py:21-32`

### 7. Parallel Scene Rendering
- Scenes now render concurrently using multiple Playwright browser pages (one per scene)
- Bounded by `asyncio.Semaphore(MAX_CONCURRENT)` — controlled by `RENDER_CONCURRENCY` env var (default: 4)
- Each scene gets its own page, `asyncio.gather` maintains result order
- `on_scene_done` callback fires after each scene for real-time progress
- `stage4_render.py:38-92`

### 8. Parallel Video Assembly
- Scene clips now assemble in parallel using `ThreadPoolExecutor` (was sequential)
- Added `-preset ultrafast` to all libx264 ffmpeg calls (~10% larger files, much faster encoding)
- Controlled by `ASSEMBLY_CONCURRENCY` env var (default: 4)
- `stage6_assembly.py:120-155`

### 9. Real-time Rendering Progress
- Backend: `pipeline.py` passes `on_scene_done` callback to `render_scenes()`, updates `job["scenes_done"]` after each scene
- Frontend: Processing page shows "x/n scenes" counter on the "Rendering frames" step
- Blue while in progress, green when complete
- `platform/src/app/pages/Processing.tsx:622-636`

### 10. Test Suites
- **Backend (pytest)**: 24 tests in `tests/` — covers all API endpoints, pipeline unit tests, template API
- **Frontend (vitest + React Testing Library)**: 33 tests — API client, data layer, Home page, Library page
- **Pre-push git hook**: `.git/hooks/pre-push` runs both suites before allowing `git push`
- Test files: `tests/conftest.py`, `tests/test_upload.py`, `tests/test_status.py`, `tests/test_job_data.py`, `tests/test_video.py`, `tests/test_templates_api.py`, `tests/test_pipeline.py`
- Frontend tests: `platform/src/app/lib/api.test.ts`, `platform/src/app/lib/data.test.ts`, `platform/src/app/pages/Home.test.tsx`, `platform/src/app/pages/Library.test.tsx`

### 11. Zombie Job Detection
- Frontend now counts consecutive poll failures; after 15 failures (30s) shows error instead of spinning forever
- Handles case where container restarts mid-job and old job state is lost
- `platform/src/app/pages/Processing.tsx:302-309`

---

## What Worked and What Didn't

### Worked Well
- Azure Container Apps: easy to set up, scale-to-zero saves costs, 4 CPU/8GB gives plenty of headroom
- ACR in-cloud builds: no local Docker needed, `az acr build` uploads context and builds remotely
- Parallel rendering with asyncio.gather + semaphore is clean and maintains result order
- Pre-push hook catches issues before they reach the repo

### Bugs Found and Fixed
- **Doubled ACR image path**: `az webapp create` with `--container-registry-url` prepended the URL to the image name, causing `banimcr.azurecr.io/banimcr.azurecr.io/banim-api:latest`. Fixed by using managed identity and correct image reference.
- **Missing `reducto_api_key`**: Was in local `keys.json` but not set as Azure env var. Pipeline failed at extraction stage with "Missing config key". Fixed by adding `REDUCTO_API_KEY` to Container App settings.
- **TypeScript build failure on Vercel**: `import.meta.env` not recognized — needed `src/vite-env.d.ts` with `/// <reference types="vite/client" />`.
- **Test setup included in prod build**: `beforeEach` in `src/test/setup.ts` caused TS error on Vercel. Fixed by excluding test files in `tsconfig.json`.
- **node_modules committed to git**: First commit included 60k files. Fixed by adding `node_modules/` to `.gitignore` and resetting.
- **Zombie jobs**: Container restart killed pipeline thread, frontend kept polling 404 forever. Fixed with poll failure counter.

### Known Issues / Not Yet Fixed
- **Vercel-GitHub connection**: Can't connect `nikhilanand03/holi-hack` from `spunkymartians` Vercel account. Nikhilanand needs to create the Vercel project from his account and connect the repo there. Manual `vercel --prod` needed until then.
- **No URL-based paper fetch**: Pasting arXiv URL still falls back to demo mode.
- **Container cold start**: Scale-to-zero means first request after idle triggers a cold start (~30-60s). Subsequent requests are fast.
- **`app.py:187` StaticFiles**: Mount will fail if `static/` directory doesn't exist. Not critical since frontend runs on Vercel.

---

## Key Decisions

| Decision | Why |
|----------|-----|
| Azure Container Apps over App Service | 4 CPU/8GB RAM needed for Playwright + parallel rendering. Scale-to-zero saves costs vs always-on App Service. |
| Parallel rendering (asyncio.gather + semaphore) | Each scene is independent — rendering 4 at once on 4 cores gives ~3-4x speedup. Semaphore prevents OOM. |
| Parallel assembly (ThreadPoolExecutor) | ffmpeg clip creation is CPU-bound and per-scene independent. Thread pool with 4 workers parallelizes it. |
| `-preset ultrafast` for ffmpeg | ~10% larger files but much faster encoding. No visible quality difference at 1080p. Worth the tradeoff for pipeline speed. |
| `VITE_API_URL` env var | Clean separation: empty in dev (Vite proxy handles it), set to Azure URL in production Vercel build. |
| ACR in-cloud builds | No Docker Desktop needed locally. `az acr build` uploads source and builds in Azure. |
| Pre-push hook (not pre-commit) | Tests run only when pushing, not on every commit. Keeps the dev loop fast. |
| Scale-to-zero with cold start | Saves money vs always-on. Cold start is acceptable for a non-realtime video generation pipeline. |

---

## Lessons Learned / Gotchas

1. **Azure App Service image path doubling**: When using `--container-registry-url` with `--container-image-name` that already includes the registry prefix, the URL gets doubled. Either use just the image name (e.g., `banim-api:latest`) with the registry URL, or use managed identity.

2. **Vercel `VITE_API_URL` must be set BEFORE the build**: Vite bakes `import.meta.env.VITE_*` values into the JS bundle at build time. Setting the env var after deploy does nothing — you must redeploy.

3. **`config.py` key lookup**: Keys in `keys.json` are lowercase (`reducto_api_key`), but env var lookup uses `.upper()`. The Docker container has no `keys.json`, so ALL config must be set as uppercase env vars.

4. **Vercel GitHub integration**: The Vercel GitHub app must be installed on the repo owner's GitHub account. A collaborator with Vercel can't connect a repo they don't own — the owner must create the Vercel project.

5. **Container restarts kill in-memory state**: The `_jobs` dict in `pipeline.py` is lost on restart. Background pipeline threads die. The disk-based reconstruction in `/status` helps for completed jobs, but in-progress jobs become zombies. The frontend now detects this.

6. **node_modules in git**: Always verify `.gitignore` has `node_modules/` before first commit of a JS project. A 60k-file commit is painful to undo.

7. **Test files in TypeScript build**: Vitest globals (`beforeEach`, `describe`, etc.) aren't available in the main TS build. Exclude `**/*.test.{ts,tsx}` and `src/test/` in `tsconfig.json`.

---

## Next Steps (Prioritized)

### High Priority
1. **Vercel project migration** — Nikhilanand to create Vercel project on his account, connect `nikhilanand03/holi-hack`, set root directory to `platform`, add `VITE_API_URL=https://banim-api.yellowdune-6510dc56.eastus.azurecontainerapps.io`. Then every push auto-deploys.

2. **URL-based paper fetch** — Add `POST /upload-url` to `app.py` that accepts arXiv URL/DOI, downloads PDF, starts pipeline. Update `Home.tsx:handleGenerate()` to call this instead of falling back to demo mode. See `app.py:29-48` for the existing upload endpoint pattern.

3. **Monitor pipeline performance** — Now that parallel rendering + assembly + 4-core Container App are deployed, verify actual pipeline times. Target: under 2 minutes for a typical paper. Check Azure Container Apps logs: `az containerapp logs show --name banim-api --resource-group banim-rg`.

### Medium Priority
4. **Proper video sharing via blob URLs** — Store `job["blob_url"]` (set in `pipeline.py:~212`) in the frontend video metadata. When viewing `/v/{id}`, try blob URL if backend stream fails.

5. **Container always-on option** — If cold starts are unacceptable, set `--min-replicas 1` on the Container App. Costs more but eliminates the 30-60s cold start.

6. **User authentication** — Google OAuth after 1st video, required after 3rd (per UX spec at `platform/src/imports/paper-to-video-ux-spec.md`).

### Low Priority
7. **ElevenLabs TTS** — Higher quality voices as alternative to Azure TTS.
8. **Note export** — Export notes as markdown from Viewer page.
9. **Batch processing** — Upload multiple PDFs at once.

---

## File Map

### Platform Frontend (`platform/`)
| File | Purpose |
|------|---------|
| `src/app/pages/Home.tsx` | Landing page — PDF upload, URL input, example papers, upload confirmation |
| `src/app/pages/Processing.tsx` | Progress page — polls backend, scene counter (x/n), zombie job detection |
| `src/app/pages/Viewer.tsx` | Video player — chapters in progress bar, fullscreen, keyboard shortcuts, notes |
| `src/app/pages/Library.tsx` | Video library — grid, search, sort, delete |
| `src/app/lib/api.ts` | API client — all fetch calls use `VITE_API_URL` base, typed interfaces |
| `src/app/lib/data.ts` | Mock data, templateInfo, localStorage helpers |
| `src/app/lib/api.test.ts` | 14 tests for API client functions |
| `src/app/lib/data.test.ts` | 14 tests for data layer |
| `src/app/pages/Home.test.tsx` | 3 tests for Home page rendering |
| `src/app/pages/Library.test.tsx` | 2 tests for Library page |
| `src/test/setup.ts` | Vitest setup — jest-dom matchers, localStorage mock |
| `vitest.config.ts` | Vitest config extending Vite config |
| `vite.config.ts` | Vite config with dev proxy to backend |
| `vercel.json` | SPA rewrites for Vercel |
| `tsconfig.json` | TypeScript config — excludes test files from prod build |
| `src/vite-env.d.ts` | Vite client types for `import.meta.env` |

### Python Backend (project root)
| File | Purpose |
|------|---------|
| `app.py` | FastAPI server — upload, status, data, stream, download, CORS with env var support |
| `pipeline.py` | Pipeline orchestrator — per-scene progress callback, saves extraction.json + plan.json |
| `stage1_extract.py` | PDF extraction via Reducto API + PyMuPDF |
| `stage2_planner.py` | LLM scene planning via Azure OpenAI GPT-4o |
| `stage4_render.py` | **Parallel** HTML→PNG rendering via Playwright (asyncio.gather + semaphore) |
| `stage5_tts.py` | TTS narration via Azure Speech (`en-US-AndrewMultilingualNeural`) |
| `stage6_assembly.py` | **Parallel** frame+audio→MP4 assembly via ffmpeg ThreadPoolExecutor, ultrafast preset |
| `template_registry.py` | 17 templates + 3 legacy aliases |
| `template_engine.py` | HTML injection for templates |
| `config.py` | Config loader — keys.json first, then uppercase env vars |
| `Dockerfile` | Python 3.12-slim + ffmpeg + Playwright Chromium |
| `.dockerignore` | Excludes platform/, node_modules/, .env, keys.json, output/ |
| `requirements.txt` | Python deps including httpx, reductoai, azure-storage-blob, pytest |
| `pyproject.toml` | Pytest config |

### Test Suite
| File | Tests | Coverage |
|------|-------|----------|
| `tests/conftest.py` | — | Fixtures: TestClient, tmp dirs, mock PDF, seeded job |
| `tests/test_upload.py` | 3 | POST /upload — valid PDF, non-PDF rejection, missing file |
| `tests/test_status.py` | 3 | GET /status — in-memory, 404, disk reconstruction |
| `tests/test_job_data.py` | 2 | GET /job/data — disk data, 404 |
| `tests/test_video.py` | 3 | GET /stream + /download — success, 404 |
| `tests/test_templates_api.py` | 4 | GET /api/templates, POST preview, theme.css |
| `tests/test_pipeline.py` | 9 | _sanitize, _next_run_name, create_job |

### Infrastructure
| Resource | Details |
|----------|---------|
| **Vercel** | Project `banim` on `spunkymartians-projects`. VITE_API_URL env var set. Manual deploy via `vercel --prod` from `platform/`. |
| **Azure Container Apps** | `banim-api` in `banim-rg`, 4 CPU / 8GB RAM, scale 0-1. Image: `banimcr.azurecr.io/banim-api:latest` |
| **Azure Container Registry** | `banimcr.azurecr.io` (Basic SKU). Build via `az acr build --registry banimcr --image banim-api:latest --file Dockerfile .` |
| **Azure OpenAI** | `https://banim.cognitiveservices.azure.com/`, deployment `gpt-4o` |
| **Azure TTS** | Region `eastus`, voice `en-US-AndrewMultilingualNeural` |
| **Azure Blob Storage** | Account `banimvideostorage`, container `videos`, public blob access |
| **Git hook** | `.git/hooks/pre-push` — runs pytest + vitest before push |

---

## How to Run

### Local Development
```bash
# Terminal 1: Backend
cd /Users/anvith/My\ Code/banim
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd /Users/anvith/My\ Code/banim/platform
npm run dev
# Open http://localhost:5173/
```

### Deploy Backend
```bash
cd /Users/anvith/My\ Code/banim
az acr build --registry banimcr --image banim-api:latest --file Dockerfile .
az containerapp update --name banim-api --resource-group banim-rg --image banimcr.azurecr.io/banim-api:latest
```

### Deploy Frontend
```bash
cd /Users/anvith/My\ Code/banim/platform
vercel --prod
```

### Run Tests
```bash
# Backend
cd /Users/anvith/My\ Code/banim
python -m pytest tests/ -v

# Frontend
cd /Users/anvith/My\ Code/banim/platform
npm test
```

### Live URLs
- Frontend: https://banim.vercel.app
- Backend: https://banim-api.yellowdune-6510dc56.eastus.azurecontainerapps.io
