#!/usr/bin/env npx tsx
/**
 * Runs Tesseract OCR on an image and outputs word bounding boxes
 * for specified highlight phrases as JSON.
 *
 * Usage:
 *   npx tsx scripts/ocr-positions.ts <image-path> "<phrase1>" "<phrase2>" ...
 *
 * Output (stdout):
 *   {
 *     "imageWidth": 1200,
 *     "imageHeight": 800,
 *     "highlights": [
 *       {
 *         "phrase": "government shutdown",
 *         "words": [
 *           { "text": "government", "left": 100, "top": 200, "width": 120, "height": 20 },
 *           { "text": "shutdown", "left": 225, "top": 200, "width": 90, "height": 20 }
 *         ],
 *         "boundingBox": { "left": 100, "top": 200, "width": 215, "height": 20 }
 *       }
 *     ]
 *   }
 */

import { execSync } from "child_process";

interface WordBox {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  conf: number;
}

interface HighlightResult {
  phrase: string;
  words: WordBox[];
  boundingBox: { left: number; top: number; width: number; height: number };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: npx tsx scripts/ocr-positions.ts <image-path> <phrase1> [phrase2] ...",
    );
    process.exit(1);
  }

  const imagePath = args[0];
  const phrases = args.slice(1).map((p) => p.toLowerCase());

  // Run tesseract with TSV output
  const tsvOutput = execSync(
    `tesseract "${imagePath}" stdout --psm 6 tsv 2>/dev/null`,
    { encoding: "utf-8" },
  );

  const lines = tsvOutput.trim().split("\n");
  const headers = lines[0].split("\t");

  const words: WordBox[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const text = cols[headers.indexOf("text")]?.trim();
    if (!text || text === "" || text === "-1") continue;

    const conf = parseInt(cols[headers.indexOf("conf")] || "0", 10);
    if (conf < 30) continue; // skip low confidence

    words.push({
      text,
      left: parseInt(cols[headers.indexOf("left")] || "0", 10),
      top: parseInt(cols[headers.indexOf("top")] || "0", 10),
      width: parseInt(cols[headers.indexOf("width")] || "0", 10),
      height: parseInt(cols[headers.indexOf("height")] || "0", 10),
      conf,
    });
  }

  // Get image dimensions from tesseract output (page-level bounding box)
  // or from the first line with level=1
  let imageWidth = 0;
  let imageHeight = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const level = parseInt(cols[headers.indexOf("level")] || "0", 10);
    if (level === 1) {
      imageWidth = parseInt(cols[headers.indexOf("width")] || "0", 10);
      imageHeight = parseInt(cols[headers.indexOf("height")] || "0", 10);
      break;
    }
  }

  // Match phrases by scanning consecutive words
  const highlights: HighlightResult[] = [];

  for (const phrase of phrases) {
    const phraseWords = phrase.split(/\s+/);
    const found: HighlightResult[] = [];

    for (let i = 0; i <= words.length - phraseWords.length; i++) {
      let match = true;
      for (let j = 0; j < phraseWords.length; j++) {
        const wordText = words[i + j].text.toLowerCase().replace(/[^a-z0-9]/g, "");
        const phraseWord = phraseWords[j].replace(/[^a-z0-9]/g, "");
        if (wordText !== phraseWord) {
          match = false;
          break;
        }
      }

      if (match) {
        const matchedWords = words.slice(i, i + phraseWords.length);
        const left = Math.min(...matchedWords.map((w) => w.left));
        const top = Math.min(...matchedWords.map((w) => w.top));
        const right = Math.max(...matchedWords.map((w) => w.left + w.width));
        const bottom = Math.max(...matchedWords.map((w) => w.top + w.height));

        found.push({
          phrase: args[phrases.indexOf(phrase) + 1], // preserve original casing
          words: matchedWords,
          boundingBox: {
            left,
            top,
            width: right - left,
            height: bottom - top,
          },
        });
      }
    }

    highlights.push(...found);
  }

  const result = {
    imageWidth,
    imageHeight,
    highlights,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
