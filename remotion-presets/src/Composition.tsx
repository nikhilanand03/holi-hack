import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = {
  bg: "#0f172a",
  node: "#3b82f6",
  nodeStroke: "#60a5fa",
  activeNode: "#22d3ee",
  connection: "#334155",
  activeConnection: "#22d3ee",
  pulse: "#22d3ee",
  text: "#e2e8f0",
  labelText: "#94a3b8",
};

const LAYERS = [
  { name: "Input", count: 4 },
  { name: "Hidden 1", count: 6 },
  { name: "Hidden 2", count: 5 },
  { name: "Output", count: 3 },
];

const NODE_RADIUS = 18;

function getNodePositions(
  width: number,
  height: number,
): { x: number; y: number; layer: number; index: number }[] {
  const positions: { x: number; y: number; layer: number; index: number }[] =
    [];
  const layerCount = LAYERS.length;
  const horizontalPadding = 180;
  const verticalPadding = 80;
  const usableWidth = width - horizontalPadding * 2;
  const usableHeight = height - verticalPadding * 2;

  for (let l = 0; l < layerCount; l++) {
    const x = horizontalPadding + (l / (layerCount - 1)) * usableWidth;
    const nodeCount = LAYERS[l].count;
    for (let i = 0; i < nodeCount; i++) {
      const y =
        verticalPadding +
        usableHeight / 2 +
        (i - (nodeCount - 1) / 2) * (usableHeight / Math.max(nodeCount, 1));
      positions.push({ x, y, layer: l, index: i });
    }
  }
  return positions;
}

function getConnections(
  positions: { x: number; y: number; layer: number; index: number }[],
): { from: number; to: number }[] {
  const connections: { from: number; to: number }[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = 0; j < positions.length; j++) {
      if (positions[j].layer === positions[i].layer + 1) {
        connections.push({ from: i, to: j });
      }
    }
  }
  return connections;
}

export const MyComposition = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const positions = getNodePositions(width, height);
  const connections = getConnections(positions);

  // Timeline (in seconds):
  // 0-1s: Nodes appear layer by layer
  // 1-2s: Connections draw in
  // 2-5s: Signal pulses propagate through layers
  // 5-7s: Hold with all active

  const connectionDrawStart = 0.6 * fps;
  const connectionDrawEnd = 2 * fps;
  const pulseStart = 2.2 * fps;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <svg width={width} height={height}>
        {/* Connections */}
        {connections.map((conn, idx) => {
          const fromPos = positions[conn.from];
          const toPos = positions[conn.to];
          const layerIndex = fromPos.layer;
          // Stagger connection drawing by layer
          const layerDelay = layerIndex * 0.3 * fps;
          const drawProgress = interpolate(
            frame,
            [
              connectionDrawStart + layerDelay,
              connectionDrawEnd + layerDelay + 0.2 * fps,
            ],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          // Pulse animation - travels along connection
          const pulseLayerStart = pulseStart + layerIndex * 0.8 * fps;
          const pulseProgress = interpolate(
            frame,
            [pulseLayerStart, pulseLayerStart + 0.6 * fps],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const isActive = pulseProgress > 0 && pulseProgress < 1;
          const isPast = pulseProgress >= 1;

          // Line path
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (dx / len) * NODE_RADIUS;
          const offsetY = (dy / len) * NODE_RADIUS;

          const x1 = fromPos.x + offsetX;
          const y1 = fromPos.y + offsetY;
          const x2 = fromPos.x + offsetX + (toPos.x - fromPos.x - 2 * offsetX) * drawProgress;
          const y2 = fromPos.y + offsetY + (toPos.y - fromPos.y - 2 * offsetY) * drawProgress;

          const fullX2 = toPos.x - offsetX;
          const fullY2 = toPos.y - offsetY;

          // Pulse dot position
          const pulseDotX = interpolate(pulseProgress, [0, 1], [x1, fullX2]);
          const pulseDotY = interpolate(pulseProgress, [0, 1], [y1, fullY2]);

          return (
            <g key={`conn-${idx}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isPast ? COLORS.activeConnection : COLORS.connection}
                strokeWidth={isPast ? 1.5 : 1}
                opacity={isPast ? 0.6 : 0.3}
              />
              {isActive && (
                <>
                  {/* Glowing pulse traveling along connection */}
                  <circle
                    cx={pulseDotX}
                    cy={pulseDotY}
                    r={3}
                    fill={COLORS.pulse}
                    opacity={0.9}
                  />
                  <circle
                    cx={pulseDotX}
                    cy={pulseDotY}
                    r={8}
                    fill={COLORS.pulse}
                    opacity={0.3}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {positions.map((pos, idx) => {
          const nodeDelay =
            (pos.layer * 0.25 * fps) + (pos.index * 2);

          const nodeScale = spring({
            frame,
            fps,
            delay: nodeDelay,
            config: { damping: 12, stiffness: 150 },
          });

          // Node activation based on pulse reaching this layer
          const activationStart = pulseStart + pos.layer * 0.8 * fps;
          const activationProgress = interpolate(
            frame,
            [activationStart - 0.1 * fps, activationStart + 0.3 * fps],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const isActivated = activationProgress > 0;

          const glowRadius = interpolate(activationProgress, [0, 1], [0, 12], {
            extrapolateRight: "clamp",
          });

          const nodeColor = isActivated ? COLORS.activeNode : COLORS.node;
          const strokeColor = isActivated ? COLORS.activeNode : COLORS.nodeStroke;

          return (
            <g
              key={`node-${idx}`}
              transform={`translate(${pos.x}, ${pos.y}) scale(${nodeScale})`}
            >
              {/* Glow effect when activated */}
              {isActivated && (
                <circle
                  cx={0}
                  cy={0}
                  r={NODE_RADIUS + glowRadius}
                  fill="none"
                  stroke={COLORS.activeNode}
                  strokeWidth={2}
                  opacity={0.3 * activationProgress}
                />
              )}
              {/* Node circle */}
              <circle
                cx={0}
                cy={0}
                r={NODE_RADIUS}
                fill={COLORS.bg}
                stroke={strokeColor}
                strokeWidth={2.5}
                opacity={0.95}
              />
              {/* Inner fill */}
              <circle
                cx={0}
                cy={0}
                r={NODE_RADIUS - 4}
                fill={nodeColor}
                opacity={isActivated ? 0.3 : 0.15}
              />
            </g>
          );
        })}

        {/* Layer labels */}
        {LAYERS.map((layer, l) => {
          const layerX =
            180 + (l / (LAYERS.length - 1)) * (width - 360);

          const labelOpacity = interpolate(
            frame,
            [l * 0.25 * fps, l * 0.25 * fps + 0.3 * fps],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const labelY = spring({
            frame,
            fps,
            delay: l * 0.25 * fps,
            config: { damping: 200 },
          });

          return (
            <g key={`label-${l}`}>
              <text
                x={layerX}
                y={interpolate(labelY, [0, 1], [height - 20, height - 40])}
                textAnchor="middle"
                fill={COLORS.labelText}
                fontSize={14}
                fontWeight={600}
                opacity={labelOpacity}
              >
                {layer.name}
              </text>
              <text
                x={layerX}
                y={interpolate(labelY, [0, 1], [height - 2, height - 22])}
                textAnchor="middle"
                fill={COLORS.labelText}
                fontSize={11}
                opacity={labelOpacity * 0.6}
              >
                {layer.count} neurons
              </text>
            </g>
          );
        })}

        {/* Title */}
        {(() => {
          const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateRight: "clamp",
          });
          const titleY = spring({
            frame,
            fps,
            config: { damping: 200 },
          });
          return (
            <text
              x={width / 2}
              y={interpolate(titleY, [0, 1], [20, 38])}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize={22}
              fontWeight={700}
              opacity={titleOpacity}
            >
              Multi-Layer Perceptron
            </text>
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};
