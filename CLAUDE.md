# PaperVideo (Banim)

PDF → narrated animated video. Pipeline: Extract → Plan → Render → TTS → Assemble.

## Structure

- `app.py` / `run_cli.py` — entry points
- `pipeline/` — all stage logic (extract, planner, render, tts, assembly, config, templates)
- `platform/` — React frontend (Vite + Tailwind + Radix)
- `remotion-presets/` — React video compositions
- `templates/scenes/` — HTML templates for Playwright renderer

## Commands

```bash
source .venv/bin/activate && uvicorn app:app --port 8000   # backend
cd platform && npm run dev                                  # frontend
python -m pytest tests/ -v && cd platform && npm test       # all tests
./scripts/deploy.sh                                         # deploy to Azure
```

## Rules

- Don't commit `keys.json`, `.env`, or `output/`
- Don't modify templates without checking `pipeline/template_registry.py`
- Remotion rendering needs a VM (Container Apps OOMs) — use `mars2` in Azure
- Pre-push hook runs pytest + vitest — all 57 tests must pass
