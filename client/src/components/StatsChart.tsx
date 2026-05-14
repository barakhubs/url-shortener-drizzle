import type { StatsResponse } from "../api";

interface Props {
  data: StatsResponse["clicksPerDay"];
}

const BAR_COLOR = "var(--color-primary)";
const BAR_HOVER_COLOR = "var(--color-primary-dark)";
const CHART_HEIGHT = 100;
const GAP = 6;
// Minimum container width the chart will fill before bars start compressing
const MIN_WIDTH = 300;
// Maximum bar width — bars get narrower when there are many, never exceed this
const MAX_BAR_WIDTH = 32;

export function StatsChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="stats-chart__empty">No click data yet.</p>;
  }

  // Distribute bars evenly across MIN_WIDTH, capped at MAX_BAR_WIDTH
  const barWidth = Math.min(
    MAX_BAR_WIDTH,
    Math.floor((MIN_WIDTH - (data.length - 1) * GAP) / data.length),
  );
  const totalWidth = data.length * (barWidth + GAP) - GAP;
  // viewBox is always at least MIN_WIDTH wide so the SVG doesn't stretch when few bars
  const viewBoxWidth = Math.max(totalWidth, MIN_WIDTH);
  // Center bars inside the viewBox when they don't fill it
  const offsetX = Math.floor((viewBoxWidth - totalWidth) / 2);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="stats-chart">
      <p className="stats-chart__title">Clicks per day (last 30 days)</p>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${CHART_HEIGHT + 24}`}
        width="100%"
        style={{ maxHeight: 160 }}
        aria-label="Clicks per day bar chart"
        role="img"
      >
        {data.map((d, i) => {
          const barHeight = Math.max((d.count / maxCount) * CHART_HEIGHT, 3);
          const x = offsetX + i * (barWidth + GAP);
          const y = CHART_HEIGHT - barHeight;

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={BAR_COLOR}
                rx={3}
                onMouseEnter={(e) =>
                  ((e.target as SVGRectElement).style.fill = BAR_HOVER_COLOR)
                }
                onMouseLeave={(e) =>
                  ((e.target as SVGRectElement).style.fill = BAR_COLOR)
                }
              >
                <title>{`${d.date}: ${d.count} click${d.count !== 1 ? "s" : ""}`}</title>
              </rect>
              {/* Show label for first, middle, and last bar only */}
              {(i === 0 ||
                i === data.length - 1 ||
                i === Math.floor(data.length / 2)) && (
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-muted)"
                >
                  {d.date.slice(5)} {/* MM-DD */}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
