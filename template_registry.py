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
    # --- Static templates (1-9) ---
    TemplateMeta("title_card",         "title_card.html",         animated=True,  animation_duration_ms=2000),
    TemplateMeta("flashcard_list",     "flashcard_list.html",     animated=True,  animation_duration_ms=2500),
    TemplateMeta("data_table",         "data_table.html",         animated=True,  animation_duration_ms=2000),
    TemplateMeta("big_number",         "big_number.html",         animated=True,  animation_duration_ms=1500),
    TemplateMeta("comparison_split",   "comparison_split.html",   animated=True,  animation_duration_ms=2000),
    TemplateMeta("quote_highlight",    "quote_highlight.html",    animated=True,  animation_duration_ms=1500),
    TemplateMeta("section_header",     "section_header.html",     animated=True,  animation_duration_ms=1500),
    TemplateMeta("image_with_caption", "image_with_caption.html", animated=False, animation_duration_ms=0),
    TemplateMeta("closing_card",       "closing_card.html",       animated=True,  animation_duration_ms=2000),
    # --- Chart templates (10-16) ---
    TemplateMeta("bar_chart",          "bar_chart.html",          animated=False, animation_duration_ms=0),
    TemplateMeta("grouped_bar_chart",  "grouped_bar_chart.html",  animated=False, animation_duration_ms=0),
    TemplateMeta("horizontal_bar_chart","horizontal_bar_chart.html", animated=False, animation_duration_ms=0),
    TemplateMeta("line_chart",         "line_chart.html",         animated=False, animation_duration_ms=0),
    TemplateMeta("scatter_plot",       "scatter_plot.html",       animated=False, animation_duration_ms=0),
    TemplateMeta("pie_donut_chart",    "pie_donut_chart.html",    animated=False, animation_duration_ms=0),
    TemplateMeta("heatmap",            "heatmap.html",            animated=False, animation_duration_ms=0),
    # --- Multi-metric ---
    TemplateMeta("multi_metric_cards", "multi_metric_cards.html", animated=True,  animation_duration_ms=2000),
]

REGISTRY: dict[str, TemplateMeta] = {t.name: t for t in _TEMPLATES}
TEMPLATE_NAMES: list[str] = list(REGISTRY.keys())


def get_template(name: str) -> TemplateMeta:
    """Look up template by name. Raises KeyError if not found."""
    if name not in REGISTRY:
        raise KeyError(f"Unknown template '{name}'. Valid: {TEMPLATE_NAMES}")
    return REGISTRY[name]
