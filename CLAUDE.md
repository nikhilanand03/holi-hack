# PaperVideo (Banim)

AI platform that converts research papers (PDFs) into animated video presentations.

## Stack

- **Backend:** Python 3.12, FastAPI, Playwright, ffmpeg
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS 4, Radix UI
- **Cloud:** Azure (OpenAI, TTS, Blob Storage, Container Apps), Reducto API, Vercel

## Project Structure

```
app.py              # FastAPI server
pipeline.py         # Job orchestrator
stage1_extract.py   # PDF extraction (Reducto + PyMuPDF)
stage2_planner.py   # LLM scene planning (Azure OpenAI gpt-4o)
stage4_render.py    # Parallel HTML→PNG (Playwright)
stage5_tts.py       # Azure TTS with retry
stage6_assembly.py  # Parallel ffmpeg assembly
template_engine.py  # HTML data injection
template_registry.py # 20 animation templates
config.py           # keys.json → env var fallback
platform/           # React frontend
  src/app/pages/    # Home, Processing, Viewer, Library
  src/app/components/
```

## Commands

```bash
# Backend
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
python -m pytest tests/ -v

# Frontend
cd platform && npm run dev    # proxies to localhost:8000
cd platform && npm run build
cd platform && npm test

# Deploy
./scripts/deploy.sh                # build + deploy in one step
az acr build --registry banimcr --image banim-api:latest --file Dockerfile .
az containerapp update --name banim-api --resource-group banim-rg --image banimcr.azurecr.io/banim-api:latest

# Azure shell access & logs
./scripts/shell.sh                 # shell into running container
./scripts/logs.sh                  # stream container logs
```

## Key Patterns

- **Pipeline:** Extract → Plan → Render → TTS → Assemble (parallel where possible)
- **Config:** `config.py` reads `keys.json` locally, falls back to uppercase env vars
- **No database** — in-memory job state + filesystem + Azure Blob Storage
- **Pre-push hook** runs pytest + vitest
- **CORS:** localhost:5173, banim.vercel.app, holi-hack.vercel.app (or CORS_ORIGINS env)

## Don'ts

- Don't commit `keys.json`, `.env`, or anything in `output/`
- Don't modify templates without checking `template_registry.py` mappings
