import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import rough from "roughjs";
import { useMemo } from "react";

const HighlightBoxSchema = z.object({
  phrase: z.string(),
  boundingBox: z.object({
    left: z.number(),
    top: z.number(),
    width: z.number(),
    height: z.number(),
  }),
});

export const ArticleHighlightSchema = z.object({
  imageSrc: z.string().describe("Path to article image (use staticFile())"),
  imageWidth: z.number().describe("Original image width in px"),
  imageHeight: z.number().describe("Original image height in px"),
  highlights: z.array(HighlightBoxSchema),
  highlightColor: z.string().optional().default("rgba(255, 230, 0, 0.55)"),
});

type ArticleHighlightProps = z.infer<typeof ArticleHighlightSchema>;

/**
 * Generates a rough.js highlight path as an SVG path string.
 * Uses a fixed seed for deterministic rendering across frames.
 */
function generateRoughHighlightPath(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): string[] {
  // Create an offscreen SVG to extract the path
  if (typeof document === "undefined") return [];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const rc = rough.svg(svg);

  // Draw a filled rectangle with rough.js
  const node = rc.rectangle(x, y, w, h, {
    fill: "currentColor",
    fillStyle: "solid",
    roughness: 1.5,
    bowing: 2,
    seed,
    stroke: "none",
    fillWeight: 2,
  });

  // Extract all path `d` attributes
  const paths: string[] = [];
  node.querySelectorAll("path").forEach((p) => {
    const d = p.getAttribute("d");
    if (d) paths.push(d);
  });
  return paths;
}

/**
 * A single animated highlighter mark
 */
const HighlighterMark: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  progress: number; // 0 to 1
  seed: number;
}> = ({ x, y, width, height, color, progress, seed }) => {
  // Add padding around the bounding box for the marker effect
  const padX = 6;
  const padY = 4;
  const mx = x - padX;
  const my = y - padY;
  const mw = width + padX * 2;
  const mh = height + padY * 2;

  const paths = useMemo(
    () => generateRoughHighlightPath(mx, my, mw, mh, seed),
    [mx, my, mw, mh, seed],
  );

  if (paths.length === 0 || progress <= 0) return null;

  // Clip from left to right to animate the "drawing" effect
  const clipRight = mx + mw * progress;

  return (
    <g>
      <defs>
        <clipPath id={`clip-${seed}`}>
          <rect x={mx} y={my} width={clipRight - mx} height={mh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${seed})`} style={{ mixBlendMode: "multiply" }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={color} stroke="none" />
        ))}
      </g>
    </g>
  );
};

export const ArticleHighlight: React.FC<ArticleHighlightProps> = ({
  imageSrc,
  imageWidth,
  imageHeight,
  highlights,
  highlightColor = "rgba(255, 230, 0, 0.55)",
}) => {
  const frame = useCurrentFrame();
  const { fps, width: compWidth, height: compHeight } = useVideoConfig();

  // --- Layout: fit image with generous padding ---
  const padding = 120;
  const availW = compWidth - padding * 2;
  const availH = compHeight - padding * 2;
  const scale = Math.min(availW / imageWidth, availH / imageHeight);
  const imgDisplayW = imageWidth * scale;
  const imgDisplayH = imageHeight * scale;
  const imgLeft = (compWidth - imgDisplayW) / 2;
  const imgTop = (compHeight - imgDisplayH) / 2;

  // --- Animation timeline ---
  const totalDuration = 5 * fps; // 5 seconds

  // 1. Blur: 8px -> 0 over first 1 second
  const blurAmount = interpolate(frame, [0, 1 * fps], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. Subtle zoom: 1.0 -> 1.06 over 5 seconds
  const zoomScale = interpolate(frame, [0, totalDuration], [1.0, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. 3D rotation: slowly rotate from left-ish to right-ish
  //    rotateY: -7.5deg -> +7.5deg (total 15deg sweep)
  //    rotateX: slight tilt -3deg -> +3deg
  const rotateY = interpolate(frame, [0, totalDuration], [-7.5, 7.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotateX = interpolate(frame, [0, totalDuration], [-3, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. Highlights: start after blur is done (1s), stagger each by 0.4s
  //    Each highlight takes 0.6s to draw
  const highlightStartFrame = 1.0 * fps;
  const highlightStagger = 0.4 * fps;
  const highlightDrawDuration = 0.6 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      {/* 3D perspective container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          perspective: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Rotating + zooming card */}
        <div
          style={{
            width: compWidth,
            height: compHeight,
            transformStyle: "preserve-3d",
            transform: `scale(${zoomScale}) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
            filter: blurAmount > 0.1 ? `blur(${blurAmount}px)` : undefined,
            position: "relative",
          }}
        >
          {/* White background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "white",
            }}
          />

          {/* Article image */}
          <Img
            src={imageSrc}
            style={{
              position: "absolute",
              left: imgLeft,
              top: imgTop,
              width: imgDisplayW,
              height: imgDisplayH,
            }}
          />

          {/* Highlighter overlay — uses mix-blend-mode: multiply
              so highlights appear behind text on white background */}
          <svg
            width={compWidth}
            height={compHeight}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            {highlights.map((hl, idx) => {
              const startFrame =
                highlightStartFrame + idx * highlightStagger;
              const progress = interpolate(
                frame,
                [startFrame, startFrame + highlightDrawDuration],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

              // Transform OCR coordinates to display coordinates
              const displayX = imgLeft + hl.boundingBox.left * scale;
              const displayY = imgTop + hl.boundingBox.top * scale;
              const displayW = hl.boundingBox.width * scale;
              const displayH = hl.boundingBox.height * scale;

              return (
                <HighlighterMark
                  key={idx}
                  x={displayX}
                  y={displayY}
                  width={displayW}
                  height={displayH}
                  color={highlightColor}
                  progress={progress}
                  seed={42 + idx}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
