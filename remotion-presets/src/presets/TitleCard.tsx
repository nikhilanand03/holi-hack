import { z } from "zod";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import rough from "roughjs";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

const AuthorSchema = z.object({
  name: z.string(),
  affiliation: z.string().optional(),
});

export const TitleCardSchema = z.object({
  title: z.string(),
  authors: z.union([z.string(), z.array(z.union([z.string(), AuthorSchema]))]),
  subtitle: z.string().optional(),
  venue: z.string().optional(),
  year: z.string().optional(),
  highlightPhrases: z
    .array(z.string())
    .optional()
    .default([]),
  highlightColor: z
    .string()
    .optional()
    .default("rgba(255, 230, 0, 0.55)"),
});

type TitleCardProps = z.infer<typeof TitleCardSchema>;

// --- Rough.js highlight — identical to ArticleHighlight ---

function generateRoughHighlightPath(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): string[] {
  if (typeof document === "undefined") return [];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const rc = rough.svg(svg);
  const node = rc.rectangle(x, y, w, h, {
    fill: "currentColor",
    fillStyle: "solid",
    roughness: 1.5,
    bowing: 2,
    seed,
    stroke: "none",
    fillWeight: 2,
  });
  const paths: string[] = [];
  node.querySelectorAll("path").forEach((p) => {
    const d = p.getAttribute("d");
    if (d) paths.push(d);
  });
  return paths;
}

const HighlighterMark: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  progress: number;
  seed: number;
}> = ({ x, y, width, height, color, progress, seed }) => {
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

  const clipRight = mx + mw * progress;

  return (
    <g>
      <defs>
        <clipPath id={`tc-clip-${seed}`}>
          <rect x={mx} y={my} width={clipRight - mx} height={mh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#tc-clip-${seed})`} style={{ mixBlendMode: "multiply" }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={color} stroke="none" />
        ))}
      </g>
    </g>
  );
};

// --- Split title text by highlight phrases ---

interface TextSegment {
  type: "text" | "highlight";
  value: string;
  phraseIndex: number;
}

function splitByHighlights(text: string, phrases: string[]): TextSegment[] {
  if (phrases.length === 0)
    return [{ type: "text", value: text, phraseIndex: -1 }];

  const escaped = phrases.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  const result: TextSegment[] = [];
  let lastIndex = 0;
  let match;
  let counter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: "text", value: text.slice(lastIndex, match.index), phraseIndex: -1 });
    }
    result.push({ type: "highlight", value: match[0], phraseIndex: counter++ });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    result.push({ type: "text", value: text.slice(lastIndex), phraseIndex: -1 });
  }
  return result;
}

/**
 * Inner content rendered at native resolution (no transforms).
 * This is the "image equivalent" — all text is rendered here,
 * highlights are measured here, SVG overlay sits on top.
 */
const TitleCardContent: React.FC<{
  title: string;
  authors: TitleCardProps["authors"];
  subtitle?: string;
  venue?: string;
  year?: string;
  highlightPhrases: string[];
  highlightColor: string;
  frame: number;
  fps: number;
  compWidth: number;
  compHeight: number;
}> = ({
  title,
  authors,
  subtitle,
  venue,
  year,
  highlightPhrases,
  highlightColor,
  frame,
  fps,
  compWidth,
  compHeight,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const highlightSpans = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [boxes, setBoxes] = useState<
    Array<{ x: number; y: number; width: number; height: number }>
  >([]);

  const titleSegments = useMemo(
    () => splitByHighlights(title, highlightPhrases),
    [title, highlightPhrases],
  );

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const containerRect = contentRef.current.getBoundingClientRect();
    const measured: typeof boxes = [];
    highlightSpans.current.forEach((span, idx) => {
      if (span) {
        const r = span.getBoundingClientRect();
        measured[idx] = {
          x: r.left - containerRect.left,
          y: r.top - containerRect.top,
          width: r.width,
          height: r.height,
        };
      }
    });
    setBoxes(measured);
  }, [title, highlightPhrases]);

  // Highlight timing — start at 1s, stagger 0.4s, draw 0.6s
  const hlStart = 1.0 * fps;
  const hlStagger = 0.4 * fps;
  const hlDuration = 0.6 * fps;

  // Venue
  const venueParts: string[] = [];
  if (venue) venueParts.push(venue);
  if (year && (!venue || !venue.includes(year))) venueParts.push(year);
  const venueText = venueParts.join(" · ");

  return (
    <div
      ref={contentRef}
      style={{
        width: compWidth,
        height: compHeight,
        position: "relative",
        backgroundColor: "white",
      }}
    >
      {/* Text content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "96px 128px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {venueText && (
            <div
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 16,
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#6B7280",
                marginBottom: 32,
              }}
            >
              {venueText}
            </div>
          )}

          <h1
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.2,
              color: "#1A1A1A",
              maxWidth: 1400,
              marginBottom: 0,
            }}
          >
            {titleSegments.map((seg, i) => {
              if (seg.type === "text") {
                return <span key={i}>{seg.value}</span>;
              }
              return (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) highlightSpans.current.set(seg.phraseIndex, el);
                  }}
                >
                  {seg.value}
                </span>
              );
            })}
          </h1>

          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 22,
              fontWeight: 400,
              color: "#6B7280",
              paddingTop: 32,
              maxWidth: 1200,
              lineHeight: 1.6,
            }}
          >
            {typeof authors === "string" ? (
              <span>{authors}</span>
            ) : (
              authors.map((author, i) => {
                const isLast = i === authors.length - 1;
                if (typeof author === "string") {
                  return (
                    <span key={i}>
                      {author}
                      {!isLast && ", "}
                    </span>
                  );
                }
                return (
                  <span key={i}>
                    {author.name}
                    {author.affiliation && (
                      <span style={{ fontSize: 16, color: "#9CA3AF" }}>
                        {" "}({author.affiliation})
                      </span>
                    )}
                    {!isLast && ", "}
                  </span>
                );
              })
            )}
          </div>

          {subtitle && (
            <div
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 20,
                fontStyle: "italic",
                color: "#9CA3AF",
                lineHeight: 1.6,
                paddingTop: 20,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Highlight SVG overlay — identical to ArticleHighlight */}
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
        {boxes.map((box, idx) => {
          if (!box) return null;
          const start = hlStart + idx * hlStagger;
          const progress = interpolate(
            frame,
            [start, start + hlDuration],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <HighlighterMark
              key={idx}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              color={highlightColor}
              progress={progress}
              seed={42 + idx}
            />
          );
        })}
      </svg>
    </div>
  );
};

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  authors,
  subtitle,
  venue,
  year,
  highlightPhrases = [],
  highlightColor = "rgba(255, 230, 0, 0.55)",
}) => {
  const frame = useCurrentFrame();
  const { fps, width: compWidth, height: compHeight } = useVideoConfig();

  const totalDuration = 5 * fps;

  // Identical to ArticleHighlight
  const blurAmount = interpolate(frame, [0, 1 * fps], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoomScale = interpolate(frame, [0, totalDuration], [1.0, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotateY = interpolate(frame, [0, totalDuration], [-7.5, 7.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotateX = interpolate(frame, [0, totalDuration], [-3, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
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
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `scale(${zoomScale}) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
            filter: blurAmount > 0.1 ? `blur(${blurAmount}px)` : undefined,
          }}
        >
          {/* Content + highlights rendered at native size, no transforms */}
          <TitleCardContent
            title={title}
            authors={authors}
            subtitle={subtitle}
            venue={venue}
            year={year}
            highlightPhrases={highlightPhrases}
            highlightColor={highlightColor}
            frame={frame}
            fps={fps}
            compWidth={compWidth}
            compHeight={compHeight}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
