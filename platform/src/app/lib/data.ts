// Sample papers with real generated videos
export const examplePapers = [
  {
    id: "attention",
    title: "Attention Is All You Need",
    authors: ["Vaswani et al."],
    url: "https://arxiv.org/abs/1706.03762",
    arxivId: "1706.03762",
    realJobId: "mars_attention2",
    blobUrl: "https://banimvideostorage.blob.core.windows.net/videos/mars_attention2/final.mp4",
    venue: "NeurIPS 2017",
    year: 2017,
    duration: 444,
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: ["Devlin et al."],
    url: "https://arxiv.org/abs/1810.04805",
    arxivId: "1810.04805",
    realJobId: "mars_bert1",
    blobUrl: "https://banimvideostorage.blob.core.windows.net/videos/mars_bert1/final.mp4",
    venue: "NAACL 2019",
    year: 2019,
    duration: 382,
  },
  {
    id: "contextfocus",
    title: "ContextFocus: Activation Steering for Contextual Faithfulness in LLMs",
    authors: ["Anand et al."],
    url: "https://arxiv.org/abs/2601.04131",
    arxivId: "2601.04131",
    realJobId: "mars_contextfocus1",
    blobUrl: "https://banimvideostorage.blob.core.windows.net/videos/mars_contextfocus1/final.mp4",
    venue: "arXiv 2025",
    year: 2025,
    duration: 397,
  },
];

// All available template types (from template_registry.py)
export const templateTypes = [
  // Layout templates
  "title_card",
  "flashcard_list",
  "data_table",
  "big_number",
  "comparison_split",
  "quote_highlight",
  "section_header",
  "image_with_caption",
  "closing_card",
  // Chart templates
  "bar_chart",
  "grouped_bar_chart",
  "horizontal_bar_chart",
  "line_chart",
  "scatter_plot",
  "pie_donut_chart",
  "heatmap",
  "multi_metric_cards",
] as const;

export type TemplateType = (typeof templateTypes)[number];

// Template display info for the UI
export const templateInfo: Record<
  string,
  { label: string; icon: string; category: "layout" | "chart" }
> = {
  title_card: { label: "Title Card", icon: "📄", category: "layout" },
  flashcard_list: { label: "Flashcard List", icon: "📋", category: "layout" },
  data_table: { label: "Data Table", icon: "📊", category: "layout" },
  big_number: { label: "Big Number", icon: "🔢", category: "layout" },
  comparison_split: { label: "Comparison", icon: "⚖️", category: "layout" },
  quote_highlight: { label: "Quote", icon: "💬", category: "layout" },
  section_header: { label: "Section Header", icon: "📑", category: "layout" },
  image_with_caption: { label: "Figure", icon: "🖼️", category: "layout" },
  closing_card: { label: "Closing", icon: "🏁", category: "layout" },
  bar_chart: { label: "Bar Chart", icon: "📊", category: "chart" },
  grouped_bar_chart: {
    label: "Grouped Bar",
    icon: "📊",
    category: "chart",
  },
  horizontal_bar_chart: {
    label: "Horizontal Bar",
    icon: "📊",
    category: "chart",
  },
  line_chart: { label: "Line Chart", icon: "📈", category: "chart" },
  scatter_plot: { label: "Scatter Plot", icon: "⚬", category: "chart" },
  pie_donut_chart: { label: "Donut Chart", icon: "🍩", category: "chart" },
  heatmap: { label: "Heatmap", icon: "🗺️", category: "chart" },
  multi_metric_cards: {
    label: "Multi Metrics",
    icon: "📏",
    category: "chart",
  },
};

// Minimal mock data for demo/fallback mode. Real videos stream from blob storage.
export const mockPaperData: Record<string, any> = {
  attention: {
    title: "Attention Is All You Need",
    authors: ["Vaswani et al."],
    venue: "NeurIPS 2017",
    year: 2017,
    url: "https://arxiv.org/abs/1706.03762",
    abstract: "We propose the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
    sections: [
      { id: "intro", title: "Introduction", content: "The Transformer replaces recurrent layers with multi-headed self-attention." },
      { id: "results", title: "Results", content: "Achieves 28.4 BLEU on WMT 2014 English-to-German." },
    ],
    scenes: [{ id: 1, type: "title_card", label: "Title", duration: 10, narration: "Attention Is All You Need introduced the Transformer." }],
    duration: 444,
  },
  bert: {
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: ["Devlin et al."],
    venue: "NAACL 2019",
    year: 2019,
    url: "https://arxiv.org/abs/1810.04805",
    abstract: "BERT pre-trains deep bidirectional representations by jointly conditioning on both left and right context.",
    sections: [
      { id: "intro", title: "Introduction", content: "BERT uses masked language modeling for bidirectional pre-training." },
      { id: "results", title: "Results", content: "State-of-the-art on 11 NLP tasks including GLUE (80.5%) and SQuAD (93.2 F1)." },
    ],
    scenes: [{ id: 1, type: "title_card", label: "Title", duration: 10, narration: "BERT revolutionized NLP with bidirectional pre-training." }],
    duration: 382,
  },
  contextfocus: {
    title: "ContextFocus: Activation Steering for Contextual Faithfulness in Large Language Models",
    authors: ["Anand et al."],
    venue: "arXiv",
    year: 2025,
    url: "https://arxiv.org/abs/2601.04131",
    abstract: "A lightweight activation steering method that enhances faithfulness to retrieved context without fine-tuning.",
    sections: [
      { id: "intro", title: "Introduction", content: "LLMs struggle with contextual faithfulness when context conflicts with parametric memory." },
      { id: "results", title: "Results", content: "Outperforms ContextDPO and COIECD on the ConFiQA benchmark." },
    ],
    scenes: [{ id: 1, type: "title_card", label: "Title", duration: 10, narration: "ContextFocus improves LLM faithfulness to retrieved context." }],
    duration: 397,
  },
};

// Processing stages matching pipeline.py Status enum
export const processingStages = [
  {
    id: "extracting",
    label: "Extracting content",
    description: "Reading PDF, pulling text, tables, and figures",
  },
  {
    id: "planning",
    label: "Planning scenes",
    description: "AI selects templates and organizes the narrative",
  },
  {
    id: "rendering",
    label: "Rendering frames",
    description: "Generating visual slides and charts from templates",
  },
  {
    id: "synthesizing_tts",
    label: "Synthesizing narration",
    description: "Text-to-speech audio generation",
  },
  {
    id: "assembling",
    label: "Assembling video",
    description: "Stitching frames and audio into final MP4",
  },
];

// Helper to get or create a video ID
export function getOrCreateVideoId(paperId: string): string {
  const videos = JSON.parse(localStorage.getItem("videos") || "{}");

  if (videos[paperId]) {
    return videos[paperId];
  }

  const videoId = generateId();
  videos[paperId] = videoId;
  localStorage.setItem("videos", JSON.stringify(videos));

  return videoId;
}

// Extract arxiv ID from a URL like https://arxiv.org/abs/1706.03762
function extractArxivId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
  return match ? match[1] : null;
}

// Helper to save a completed video to library
export function saveVideoToLibrary(videoId: string, paperData: any) {
  const library = JSON.parse(localStorage.getItem("library") || "[]");

  const existingIndex = library.findIndex((v: any) => v.id === videoId);

  const arxivId = paperData.arxivId || extractArxivId(paperData.url);

  const videoEntry = {
    id: videoId,
    ...paperData,
    ...(arxivId && { arxivId }),
    generatedAt: new Date().toISOString(),
    views: existingIndex >= 0 ? library[existingIndex].views : 0,
  };

  if (existingIndex >= 0) {
    library[existingIndex] = videoEntry;
  } else {
    library.unshift(videoEntry);
  }

  localStorage.setItem("library", JSON.stringify(library));
}

// Helper to get library
export function getLibrary() {
  return JSON.parse(localStorage.getItem("library") || "[]");
}

// Helper to get video by ID
export function getVideoById(videoId: string) {
  const library = getLibrary();
  return library.find((v: any) => v.id === videoId);
}

// Helper to increment view count
export function incrementViewCount(videoId: string) {
  const library = getLibrary();
  const video = library.find((v: any) => v.id === videoId);

  if (video) {
    video.views = (video.views || 0) + 1;
    localStorage.setItem("library", JSON.stringify(library));
  }
}

// Helper to get/set notes for a video
export function getNotes(videoId: string) {
  const notes = JSON.parse(localStorage.getItem(`notes_${videoId}`) || "[]");
  return notes;
}

export function saveNote(
  videoId: string,
  note: { timestamp: number; text: string }
) {
  const notes = getNotes(videoId);
  notes.push({
    id: generateId(),
    ...note,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(`notes_${videoId}`, JSON.stringify(notes));
}

export function deleteNote(videoId: string, noteId: string) {
  const notes = getNotes(videoId);
  const filtered = notes.filter((n: any) => n.id !== noteId);
  localStorage.setItem(`notes_${videoId}`, JSON.stringify(filtered));
}

// Look up a video by its arxivId
export function getVideoByArxivId(arxivId: string) {
  const library = getLibrary();
  return library.find((v: any) => v.arxivId === arxivId);
}

// Seed sample showcase items into library on first visit
export function seedSampleItems() {
  const library = getLibrary();
  const SEED_KEY = "samples_seeded_v9";
  if (localStorage.getItem(SEED_KEY)) return;

  for (const paper of examplePapers) {
    const data = mockPaperData[paper.id];
    if (!data) continue;

    const existingIdx = library.findIndex(
      (v: any) => v.arxivId === paper.arxivId || v.title === data.title
    );

    const entry = {
      id: existingIdx >= 0 ? library[existingIdx].id : generateId(),
      title: data.title,
      authors: data.authors,
      venue: data.venue,
      year: data.year,
      url: data.url,
      abstract: data.abstract,
      sections: data.sections,
      scenes: data.scenes,
      duration: paper.duration || data.duration,
      arxivId: paper.arxivId,
      realJobId: paper.realJobId || undefined,
      blobUrl: paper.blobUrl || undefined,
      generatedAt: new Date().toISOString(),
      views: existingIdx >= 0 ? library[existingIdx].views : 0,
      isSample: true,
    };

    if (existingIdx >= 0) {
      library[existingIdx] = entry;
    } else {
      library.unshift(entry);
    }
  }

  localStorage.setItem("library", JSON.stringify(library));
  localStorage.setItem(SEED_KEY, "1");
}

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
