// Mock data for example papers
export const examplePapers = [
  {
    id: "attention",
    title: "Attention Is All You Need",
    authors: ["Vaswani et al."],
    url: "https://arxiv.org/abs/1706.03762",
    arxivId: "1706.03762",
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: ["Devlin et al."],
    url: "https://arxiv.org/abs/1810.04805",
    arxivId: "1810.04805",
  },
  {
    id: "alphafold",
    title: "Highly Accurate Protein Structure Prediction with AlphaFold",
    authors: ["Jumper et al."],
    url: "https://doi.org/10.1038/s41586-021-03819-2",
    arxivId: null,
  },
];

// Mock paper data
export const mockPaperData: Record<string, any> = {
  attention: {
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"],
    venue: "NeurIPS 2017",
    year: 2017,
    abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.",
    sections: [
      {
        id: "intro",
        title: "Introduction",
        content: "Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures."
      },
      {
        id: "model",
        title: "Model Architecture",
        content: "Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations to a sequence of continuous representations. Given these representations, the decoder then generates an output sequence of symbols one element at a time. The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder."
      },
      {
        id: "results",
        title: "Results",
        content: "On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new single-model state-of-the-art BLEU score of 28.4. On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.0, outperforming all of the previously published single models, at less than 1/4 the training cost."
      }
    ],
    scenes: [
      {
        id: 1,
        type: "title_card",
        label: "Title",
        duration: 8,
        narration: "Today we're looking at Attention Is All You Need, a landmark paper from Google that introduced the Transformer architecture.",
        thumbnail: "/mock-thumb-1.jpg"
      },
      {
        id: 2,
        type: "bullets",
        label: "Key Findings",
        duration: 15,
        narration: "The paper makes three key contributions: First, it proposes a novel architecture based entirely on attention mechanisms. Second, it eliminates the need for recurrence and convolutions. And third, it achieves state-of-the-art results while being more parallelizable.",
        sectionId: "intro",
        thumbnail: "/mock-thumb-2.jpg"
      },
      {
        id: 3,
        type: "diagram",
        label: "Architecture",
        duration: 20,
        narration: "The Transformer uses an encoder-decoder structure with stacked self-attention layers. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.",
        sectionId: "model",
        thumbnail: "/mock-thumb-3.jpg"
      },
      {
        id: 4,
        type: "table",
        label: "Results Table",
        duration: 18,
        narration: "On the WMT 2014 English-to-German translation task, the Transformer achieves a BLEU score of 28.4, outperforming previous state-of-the-art models by more than 2.0 BLEU points.",
        sectionId: "results",
        thumbnail: "/mock-thumb-4.jpg"
      },
      {
        id: 5,
        type: "chart",
        label: "Performance",
        duration: 12,
        narration: "The model also trains significantly faster than recurrent architectures, thanks to its parallelizable design. Training time is reduced by more than 75% compared to the best previous models.",
        sectionId: "results",
        thumbnail: "/mock-thumb-5.jpg"
      }
    ],
    videoUrl: "/mock-video.mp4",
    duration: 73
  },
  bert: {
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
    venue: "NAACL 2019",
    year: 2019,
    abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
    sections: [
      {
        id: "intro",
        title: "Introduction",
        content: "Language model pre-training has been shown to be effective for improving many natural language processing tasks. Pre-trained language representations can either be context-free or contextual. BERT uses a different pre-training objective: the 'masked language model' (MLM), inspired by the Cloze task."
      }
    ],
    scenes: [
      {
        id: 1,
        type: "title_card",
        label: "Title",
        duration: 8,
        narration: "BERT introduces bidirectional pre-training for language understanding.",
        thumbnail: "/mock-thumb-1.jpg"
      }
    ],
    videoUrl: "/mock-video.mp4",
    duration: 45
  },
  alphafold: {
    title: "Highly Accurate Protein Structure Prediction with AlphaFold",
    authors: ["John Jumper", "Richard Evans", "Alexander Pritzel", "et al."],
    venue: "Nature",
    year: 2021,
    abstract: "Proteins are essential to life, and understanding their structure can facilitate a mechanistic understanding of their function. Through an enormous experimental effort, the structures of around 100,000 unique proteins have been determined, but this represents a small fraction of the billions of known protein sequences. Structural coverage is bottlenecked by the months to years of painstaking effort required to determine a single protein structure. Accurate computational approaches are needed to address this gap and to enable large-scale structural bioinformatics. AlphaFold produces highly accurate structures.",
    sections: [
      {
        id: "intro",
        title: "Introduction",
        content: "The three-dimensional structure of a protein is intimately connected with its biological function. AlphaFold is based on a neural network trained to predict the distance between pairs of residues and to predict the angles between chemical bonds."
      }
    ],
    scenes: [
      {
        id: 1,
        type: "title_card",
        label: "Title",
        duration: 8,
        narration: "AlphaFold achieves breakthrough accuracy in protein structure prediction.",
        thumbnail: "/mock-thumb-1.jpg"
      }
    ],
    videoUrl: "/mock-video.mp4",
    duration: 52
  }
};

// Processing stages for the generation pipeline
export const processingStages = [
  {
    id: "extract",
    label: "Extracting content",
    description: "Reading PDF, pulling tables and figures"
  },
  {
    id: "plan",
    label: "Planning scenes",
    description: "Deciding what to show"
  },
  {
    id: "visuals",
    label: "Generating visuals",
    description: "Creating slides and charts"
  },
  {
    id: "narration",
    label: "Adding narration",
    description: "Text-to-speech generation"
  },
  {
    id: "assemble",
    label: "Assembling video",
    description: "Stitching everything together"
  }
];

// Helper to get or create a video ID
export function getOrCreateVideoId(paperId: string): string {
  const videos = JSON.parse(localStorage.getItem('videos') || '{}');
  
  if (videos[paperId]) {
    return videos[paperId];
  }
  
  const videoId = generateId();
  videos[paperId] = videoId;
  localStorage.setItem('videos', JSON.stringify(videos));
  
  return videoId;
}

// Helper to save a completed video to library
export function saveVideoToLibrary(videoId: string, paperData: any) {
  const library = JSON.parse(localStorage.getItem('library') || '[]');
  
  const existingIndex = library.findIndex((v: any) => v.id === videoId);
  
  const videoEntry = {
    id: videoId,
    ...paperData,
    generatedAt: new Date().toISOString(),
    views: existingIndex >= 0 ? library[existingIndex].views : 0
  };
  
  if (existingIndex >= 0) {
    library[existingIndex] = videoEntry;
  } else {
    library.unshift(videoEntry);
  }
  
  localStorage.setItem('library', JSON.stringify(library));
}

// Helper to get library
export function getLibrary() {
  return JSON.parse(localStorage.getItem('library') || '[]');
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
    localStorage.setItem('library', JSON.stringify(library));
  }
}

// Helper to get/set notes for a video
export function getNotes(videoId: string) {
  const notes = JSON.parse(localStorage.getItem(`notes_${videoId}`) || '[]');
  return notes;
}

export function saveNote(videoId: string, note: { timestamp: number; text: string }) {
  const notes = getNotes(videoId);
  notes.push({
    id: generateId(),
    ...note,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(`notes_${videoId}`, JSON.stringify(notes));
}

export function deleteNote(videoId: string, noteId: string) {
  const notes = getNotes(videoId);
  const filtered = notes.filter((n: any) => n.id !== noteId);
  localStorage.setItem(`notes_${videoId}`, JSON.stringify(filtered));
}

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
