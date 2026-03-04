"""Stage 4: Render HTML scenes to PNG frames using Playwright."""

from __future__ import annotations

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright


async def _render_scenes(html_paths: list[Path], output_dir: Path) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    png_paths: list[Path] = []

    # Resolve theme.css location for file:// URLs
    templates_dir = Path(__file__).parent / "templates"

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})

        for html_path in html_paths:
            # Inject the local theme.css by rewriting the href
            html = html_path.read_text(encoding="utf-8")
            theme_uri = templates_dir.resolve().as_uri()
            html = html.replace('href="theme.css"', f'href="{theme_uri}/theme.css"')

            # Write a temp version with resolved paths
            tmp = html_path.with_suffix(".resolved.html")
            tmp.write_text(html, encoding="utf-8")

            await page.goto(tmp.as_uri(), wait_until="networkidle")
            # Give KaTeX a moment to render
            await page.wait_for_timeout(1500)

            png_path = output_dir / f"{html_path.stem}.png"
            await page.screenshot(path=str(png_path), full_page=False)
            png_paths.append(png_path)

            tmp.unlink(missing_ok=True)

        await browser.close()

    return png_paths


def render_scenes(html_paths: list[Path], output_dir: Path) -> list[Path]:
    """Synchronous wrapper around async renderer."""
    return asyncio.run(_render_scenes(html_paths, output_dir))
