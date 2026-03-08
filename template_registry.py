"""Template registry — maps template names to metadata."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent / "templates" / "scenes"


@dataclass(frozen=True)
class TemplateMeta:
    name: str
    file: str
    animated: bool
    animation_duration_ms: int  # 0 for static templates

    @property
    def path(self) -> Path:
        return TEMPLATES_DIR / self.file


# ── Registry ────────────────────────────────────────────────────────────────

_TEMPLATES: list[TemplateMeta] = [
    # --- Layout templates ---
    TemplateMeta("title_card",      "title_card.html",      animated=False, animation_duration_ms=0),
    TemplateMeta("section_header",  "section_header.html",  animated=False, animation_duration_ms=0),
    TemplateMeta("big_number",      "big_number.html",      animated=False, animation_duration_ms=0),
    TemplateMeta("quote_highlight", "quote_highlight.html", animated=False, animation_duration_ms=0),
    TemplateMeta("bullet_list",     "bullet_list.html",     animated=False, animation_duration_ms=0),
    TemplateMeta("data_table",      "data_table.html",      animated=False, animation_duration_ms=0),
    # --- Chart templates ---
    TemplateMeta("bar_chart",       "bar_chart.html",       animated=False, animation_duration_ms=0),
    TemplateMeta("line_chart",      "line_chart.html",      animated=False, animation_duration_ms=0),
    TemplateMeta("donut_chart",     "donut_chart.html",     animated=False, animation_duration_ms=0),
]

REGISTRY: dict[str, TemplateMeta] = {t.name: t for t in _TEMPLATES}
TEMPLATE_NAMES: list[str] = list(REGISTRY.keys())


def get_template(name: str) -> TemplateMeta:
    """Look up template by name. Raises KeyError if not found."""
    if name not in REGISTRY:
        raise KeyError(f"Unknown template '{name}'. Valid: {TEMPLATE_NAMES}")
    return REGISTRY[name]
