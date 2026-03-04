"""Stage 1: Extract structured content from a scientific PDF using PyMuPDF."""

from __future__ import annotations

import re
from pathlib import Path

import fitz  # PyMuPDF


def extract_pdf(pdf_path: str | Path) -> dict:
    """Return structured content extracted from *pdf_path*.

    Returns a dict with keys:
        title, authors, abstract, sections (list[dict]),
        tables (list[str]), figures (list[dict])
    """
    doc = fitz.open(str(pdf_path))
    full_text = "\n".join(page.get_text() for page in doc)

    title = _extract_title(doc)
    authors = _extract_authors(full_text)
    abstract = _extract_abstract(full_text)
    sections = _extract_sections(full_text)
    tables = _extract_tables(doc)
    figures = _extract_figures(doc, pdf_path)

    doc.close()
    return {
        "title": title,
        "authors": authors,
        "abstract": abstract,
        "sections": sections,
        "tables": tables,
        "figures": figures,
    }


def _extract_title(doc: fitz.Document) -> str:
    meta_title = doc.metadata.get("title", "").strip()
    if meta_title:
        return meta_title
    # Fallback: largest font on first page
    page = doc[0]
    blocks = page.get_text("dict")["blocks"]
    best, best_size = "", 0.0
    for b in blocks:
        for line in b.get("lines", []):
            for span in line.get("spans", []):
                if span["size"] > best_size:
                    best_size = span["size"]
                    best = span["text"]
    return best.strip()


def _extract_authors(text: str) -> list[str]:
    # Look for lines between title and abstract that look like author names
    m = re.search(r"(?i)abstract", text)
    if not m:
        return []
    preamble = text[: m.start()]
    lines = [l.strip() for l in preamble.split("\n") if l.strip()]
    # Heuristic: author lines contain commas or 'and', not too long
    authors: list[str] = []
    for line in lines[1:]:  # skip title
        if len(line) > 200:
            continue
        if re.search(r"[,&]|(\band\b)", line) and not re.search(r"[{}]", line):
            authors.append(line)
    return authors


def _extract_abstract(text: str) -> str:
    m = re.search(
        r"(?i)\babstract\b[:\s—\-]*\n?(.*?)(?=\n\s*\n|\n\d+[\.\s]+[A-Z]|\n[A-Z][a-z]+\n)",
        text,
        re.DOTALL,
    )
    if m:
        return " ".join(m.group(1).split())
    return ""


def _extract_sections(text: str) -> list[dict]:
    # Split on numbered section headers like "1 Introduction" or "2. Methods"
    pattern = r"\n(\d+\.?\s+[A-Z][^\n]{2,80})\n"
    parts = re.split(pattern, text)
    sections: list[dict] = []
    i = 1
    while i < len(parts) - 1:
        heading = parts[i].strip()
        body = parts[i + 1].strip()
        # Trim body to first ~3000 chars to keep prompts manageable
        sections.append({"heading": heading, "body": body[:3000]})
        i += 2
    if not sections:
        # Fallback: treat entire text as one section
        sections.append({"heading": "Content", "body": text[:5000]})
    return sections


def _extract_tables(doc: fitz.Document) -> list[str]:
    tables: list[str] = []
    for page in doc:
        text = page.get_text()
        # Find table-like blocks
        for m in re.finditer(
            r"(Table\s+\d+[^\n]*\n(?:.*?\n){1,20})", text, re.IGNORECASE
        ):
            tables.append(m.group(0).strip())
    return tables


def _extract_figures(doc: fitz.Document, pdf_path: str | Path) -> list[dict]:
    figures: list[dict] = []
    out_dir = Path(pdf_path).parent
    for page_num, page in enumerate(doc):
        images = page.get_images(full=True)
        for img_idx, img_info in enumerate(images):
            xref = img_info[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n > 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                img_path = out_dir / f"fig_p{page_num}_{img_idx}.png"
                pix.save(str(img_path))
                figures.append({"path": str(img_path), "page": page_num})
            except Exception:
                continue
    return figures
