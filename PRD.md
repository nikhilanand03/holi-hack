# PaperVideo — Product Requirements Document

## Vision

PaperVideo turns any research paper into a professional, narrated animated video — automatically. Upload a PDF or paste an arXiv URL, and in minutes you have a 5–10 minute video that looks like it was hand-crafted by a motion designer.

**One-liner:** Turn research into video.

## Principles

1. **Magic over knobs.** Zero decisions required. Upload → video. No voice picker, no template selector, no length toggle.
2. **Output quality is the product.** If the video doesn't look professional enough to share, nothing else matters. Every scene should feel intentional.
3. **Academic & warm.** Paper-textured backgrounds, serif typography, hand-drawn accents. Scholarly but approachable — not corporate, not flashy.
4. **Open source.** The tool is the product, not the user.

---

## Target Users

| Persona | Need |
|---------|------|
| **Researchers** | Turn their paper into a video explainer for conferences, social media, or lab meetings |
| **Educators** | Convert lecture material or assigned readings into video lessons |
| **Science communicators** | Produce polished explainer videos from published papers |

All three share one trait: they have a PDF and not enough time to make a video from scratch.

---

## User Journey

### 1. Land

The homepage communicates value in 3 seconds.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│            "Turn research into video"            │
│                                                  │
│   ┌──────────────┐    →    ┌──────────────┐      │
│   │  PDF page    │         │  Video frame │      │
│   │  (static)    │         │  (animated)  │      │
│   └──────────────┘         └──────────────┘      │
│                                                  │
│        Before                After                │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │  Drop a PDF here, or paste an arXiv URL  │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│   ── or try one of these ──                      │
│                                                  │
│   [Attention Is All You Need]  [BERT]  [...]     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Sections (top to bottom):**

1. **Hero — Before/After showcase.** Left side: a static PDF page. Right side: the same content as an animated video frame (looping preview or auto-playing clip). Tagline above: *"Turn research into video."*
2. **Upload CTA.** A drag-and-drop zone that also accepts an arXiv URL pasted into a text field. This is the primary action — large, obvious, above the scroll line on most screens.
3. **Example gallery.** 3 pre-generated videos from well-known papers (Attention Is All You Need, BERT, and one more). Clicking one goes directly to the viewer. These exist so visitors without a PDF can immediately see the output quality.

**No sign-in button. No pricing. No feature list.** The page is the product.

### 2. Wait

After upload, the user is taken to the processing page. The pipeline takes 2–5 minutes. The goal is to make this feel **shorter than it is**.

**Layout:**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   "Turning your paper into a video..."           │
│                                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░  65%         │
│                                                  │
│   ✓ Extracted content                            │
│   ✓ Planned 12 scenes                            │
│   ◉ Rendering scenes (8/12)                      │
│   ○ Generating narration                         │
│   ○ Assembling video                             │
│                                                  │
│   ┌────────────────────────────────────────┐     │
│   │  Scene 4: "Attention Mechanism"        │     │
│   │  [live preview of scene being rendered]│     │
│   └────────────────────────────────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Key elements:**

- **Progress bar** with percentage — gives a clear sense of how far along. Smooth, not jumpy.
- **Stage checklist** — five stages (Extract → Plan → Render → TTS → Assemble). Completed stages get a checkmark. Current stage shows a spinner with progress (e.g., "8/12 scenes"). Upcoming stages are dimmed.
- **Live scene previews** — as each scene finishes rendering, show a thumbnail or short animated preview. This is the "wow" moment that makes the wait engaging. Users see the video being built piece by piece.
- **No estimated time remaining.** Time estimates are always wrong and create anxiety. The progress bar and scene previews give enough signal.

**Perceived speed tactics:**
- Start showing scene previews as soon as the first scene renders (~30s in). This gives users something to look at fast.
- Use animated transitions between stages to smooth out jumps.
- The progress bar should move continuously (interpolate between discrete events).

### 3. Watch

The viewer is where the product's quality is judged. It must feel like a premium, purpose-built video player — not a generic `<video>` tag.

**Layout:**

```
┌────────────────────────────────┬─────────────────┐
│                                │                 │
│                                │  Paper Title    │
│         VIDEO PLAYER           │  Authors        │
│         (16:9, dark bg)        │  Venue • Year   │
│                                │                 │
│  ▶ 2:34 / 8:12   🔊  ⛶       │─────────────────│
│  ━━━━━━━━━━░░░░░░░░░░░░░░░░░  │                 │
│                                │  Scenes         │
│                                │  ▸ 1. Title     │
│                                │    2. Intro     │
│                                │    3. Method    │
│                                │    4. Results   │
│                                │    5. ...       │
│                                │                 │
│                                │─────────────────│
│                                │  Abstract       │
│                                │  "We propose..."│
│                                │                 │
│                                │  [Download MP4] │
│                                │  [Copy Link]    │
│                                │                 │
└────────────────────────────────┴─────────────────┘
```

**Video player:**
- Dark background (#1A1A1A) behind the video for contrast.
- Standard controls: play/pause, seek bar, volume, fullscreen.
- No chapter segments on the seek bar (navigation lives in the sidebar).

**Sidebar:**
- **Paper metadata** at top: title, authors, venue badge, year.
- **Scene list** below: clickable scene titles. The currently playing scene is highlighted. Clicking jumps to that scene's timestamp.
- **Abstract** (collapsed by default, expandable).
- **Actions** at bottom: Download MP4, Copy shareable link.

**Shared link experience:**
When someone visits a shared link (`/v/:videoId`), they see the full viewer with all paper context. A subtle "Make your own →" link at the top navigates to the homepage. The shared view is identical to the creator's view.

### 4. Library

Browser-local storage. The library is a simple grid of previously generated videos, stored in `localStorage`.

```
┌──────────────────────────────────────────────────┐
│  Your Videos                          [Search]   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ thumb    │  │ thumb    │  │ thumb    │      │
│  │          │  │          │  │          │      │
│  │ Title    │  │ Title    │  │ Title    │      │
│  │ 5:32     │  │ 8:14     │  │ 3:47     │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Cards show a thumbnail (first frame or title card), paper title, and duration.
- Click to open in the viewer.
- Delete removes from local storage only.
- No sync, no cloud — if you clear your browser, they're gone. The shareable link still works (video is hosted).

---

## Input Handling

### PDF Upload
- Drag-and-drop zone with click fallback.
- File size limit: 50 MB (most papers are <10 MB).
- Validates file type client-side before upload.

### arXiv URL
- Text field accepts URLs like `https://arxiv.org/abs/2301.12345` or just `2301.12345`.
- Backend fetches the PDF from arXiv and proceeds as normal.
- Show the paper title after URL is pasted (quick metadata fetch) so the user knows it was recognized.

### Error Handling
- **Bad PDF / extraction failure:** Friendly message — *"We couldn't read this PDF well enough to make a video. Try a different file, or paste the arXiv URL instead."* No technical jargon, no stack traces. Offer a retry button.
- **arXiv URL not found:** *"We couldn't find a paper at that URL. Double-check the link?"*
- **Pipeline failure mid-process:** *"Something went wrong while generating your video. We're sorry — please try again."* Log the error server-side for debugging.

---

## Video Output Specification

### Format
- Resolution: 1920×1080 (1080p)
- Frame rate: 30fps
- Codec: H.264 video, AAC audio
- Container: MP4
- Target length: 5–10 minutes (depends on paper length/complexity)

### Visual Style — "Academic & Warm"
- **Backgrounds:** Warm off-white (#FAFAF8) with subtle paper texture.
- **Typography:** Source Serif 4 for headings, Inter for body text.
- **Accents:** Blue (#2563EB) primary, purple (#7C3AED) secondary.
- **Animations:** Smooth fade-ups, slide-ins, staggered reveals. Cubic-bezier easing. Nothing flashy — elegant and intentional.
- **Charts/data:** Clean Chart.js visualizations with consistent styling.
- **Figures:** Paper's original figures displayed with captions.

### Audio
- Single narrator voice (Andrew Multilingual Neural — warm, clear, natural).
- No background music.
- Narration covers 2–4 sentences per scene — enough to explain without overwhelming.

### No Branding
- No watermark during playback.
- No outro card.
- The video is the user's, not PaperVideo's.

---

## Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Before/after showcase + upload CTA + example gallery |
| `/video/:jobId` | Processing | Real-time pipeline progress with scene previews |
| `/v/:videoId` | Viewer | Video playback with sidebar (scenes, metadata, download) |
| `/library` | Library | Local history of generated videos |

**Navigation:**
- Minimal top bar: PaperVideo logo (links home) + Library link.
- No hamburger menus, no dropdowns, no settings page.

---

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#FAFAF8` | Page backgrounds |
| `bg-surface` | `#FFFFFF` | Cards, elevated surfaces |
| `bg-dark` | `#1A1A1A` | Video player background |
| `text-primary` | `#1A1A1A` | Headings, body text |
| `text-secondary` | `#6B7280` | Captions, timestamps |
| `accent-primary` | `#2563EB` | Links, active states, progress |
| `accent-secondary` | `#7C3AED` | Highlights, badges |
| `border` | `#E5E7EB` | Dividers, card borders |

### Typography
| Role | Font | Weight | Size |
|------|------|--------|------|
| Page titles | Source Serif 4 | 400 | 48px |
| Section headings | Source Serif 4 | 400 | 28px |
| Body | Inter | 400 | 16px |
| Captions | Inter | 400 | 14px |
| Mono/code | IBM Plex Mono | 400 | 14px |

### Spacing
- Page padding: 96px horizontal on desktop.
- Card padding: 24px.
- Section gaps: 64px between major sections, 24px within.
- Border radius: 12px (cards), 8px (inputs), 999px (pills/badges).

### Motion
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Duration: 300ms (micro-interactions), 500ms (page transitions).
- No motion for the sake of motion — every animation should communicate state change.

---

## Technical Requirements

### Platform
- **Desktop-only.** No responsive mobile layout required. Minimum viewport: 1280px.
- **Browser support:** Chrome, Firefox, Safari (latest 2 versions).

### Performance
- Homepage loads in <2 seconds.
- Upload starts processing within 1 second of file received.
- Video player starts playback within 2 seconds of page load (stream, don't wait for full download).

### Infrastructure
- **Backend:** FastAPI (Python), deployed on Azure.
- **Frontend:** React + Vite + Tailwind, deployed on Vercel.
- **Rendering:** Azure VM (`mars2`) for Remotion — never render locally or on Container Apps.
- **Storage:** Azure Blob Storage for generated videos.
- **No database.** Job state is file-based. Library is localStorage. This is intentional — keep it simple.

### Open Source
- MIT license.
- README with clear setup instructions.
- No accounts, no telemetry, no tracking.

---

## Success Metrics

| Metric | Target | Why it matters |
|--------|--------|----------------|
| Video quality rating (self-assessed) | 8/10+ consistently | Output quality IS the product |
| Time to first scene preview | <45 seconds | Perceived speed during processing |
| Upload-to-video completion | <5 minutes for a 10-page paper | Actual pipeline performance |
| Shared link click-through | >50% watch >1 minute | Videos are good enough that people actually watch them |

---

## What This Is NOT

- **Not a video editor.** No post-generation editing. If the output isn't good enough by default, the pipeline needs to be better — not the user.
- **Not a platform.** No accounts, no social features, no discovery, no comments. It's a tool.
- **Not a business (yet).** Open-source. Build something great first.
- **Not mobile.** Desktop-only. Shared links should render, but no responsive design investment.

---

## Open Questions

1. **arXiv URL backend** — Frontend accepts URLs but backend doesn't fetch from arXiv yet. Needs implementation.
2. **Video hosting lifecycle** — How long do generated videos persist in Azure Blob Storage? Forever? 30 days? Need a retention policy.
3. **Concurrent users** — Current architecture is single-server. What happens when 10 people upload simultaneously? Need a queue or worker pool.
4. **Scene preview during processing** — Requires streaming rendered frames to the frontend before the video is assembled. Needs a websocket or SSE implementation.
5. **Sample papers** — Confirm the 3 example papers: Attention Is All You Need, BERT, and one more (ContextFocus?). Pre-generate and host these permanently.
