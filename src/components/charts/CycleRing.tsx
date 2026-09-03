import { phaseSpans, PHASE_COLOR } from "@/features/cycle/phases";

interface CycleRingProps {
  cycleLength: number;
  cycleDay: number;
  periodLength: number;
  fertileWindow?: { startDay: number; endDay: number } | null;
  centerTop: string;
  centerBottom?: string;
  size?: number;
}

// Angle convention: 0° = top, increasing clockwise.
const SWEEP = 260; // degrees of arc drawn (open at the bottom)
const START = 360 - SWEEP / 2; // start on the lower-left

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const [sx, sy] = polar(cx, cy, r, startDeg);
  const [ex, ey] = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

/**
 * Semicircular cycle gauge: phase-coloured segments around an open arc, with a
 * pointer at the current day. Predicted regions read lighter than recorded.
 */
export function CycleRing({
  cycleLength,
  cycleDay,
  periodLength,
  fertileWindow,
  centerTop,
  centerBottom,
  size = 224,
}: CycleRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.round(size * 0.075);
  const r = (size - stroke - 6) / 2;
  const len = Math.max(20, Math.round(cycleLength));

  const dayToAngle = (day: number) =>
    START + (Math.max(0, Math.min(day, len)) / len) * SWEEP;

  const spans = phaseSpans(len, periodLength);
  const gap = 3; // degrees trimmed from each segment end

  const clampedDay = Math.max(1, Math.min(cycleDay, len));
  const markAngle = dayToAngle(clampedDay - 0.5);
  const [mx, my] = polar(cx, cy, r, markAngle);
  const [t1x, t1y] = polar(cx, cy, r + stroke / 2 + 9, markAngle - 6);
  const [t2x, t2y] = polar(cx, cy, r + stroke / 2 + 9, markAngle + 6);
  const [tipx, tipy] = polar(cx, cy, r - stroke / 2 - 1, markAngle);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size * 0.82 }}
    >
      <svg
        width={size}
        height={size * 0.82}
        viewBox={`0 0 ${size} ${size * 0.82}`}
        role="img"
        aria-label={`${centerTop}${centerBottom ? ", " + centerBottom : ""}`}
      >
        {/* track */}
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP)}
          fill="none"
          stroke="rgb(var(--pm-surface-2))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* phase segments */}
        {spans.map((s) => {
          const a0 = dayToAngle(s.startDay - 1) + gap;
          const a1 = dayToAngle(s.endDay) - gap;
          if (a1 <= a0) return null;
          return (
            <path
              key={s.phase}
              d={arcPath(cx, cy, r, a0, a1)}
              fill="none"
              stroke={PHASE_COLOR[s.phase]}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
        {/* fertile window overlay (predicted → dashed, lighter) */}
        {fertileWindow && (
          <path
            d={arcPath(
              cx,
              cy,
              r,
              dayToAngle(fertileWindow.startDay - 1) + gap,
              dayToAngle(fertileWindow.endDay) - gap,
            )}
            fill="none"
            stroke="rgb(var(--pm-accent))"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="1 6"
            opacity={0.8}
          />
        )}
        {/* current-day pointer */}
        <path
          d={`M ${t1x} ${t1y} L ${t2x} ${t2y} L ${tipx} ${tipy} Z`}
          fill="rgb(var(--pm-primary))"
          stroke="rgb(var(--pm-bg))"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <circle cx={mx} cy={my} r={stroke * 0.34} fill="rgb(var(--pm-surface))" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-4 text-center">
        <span className="font-display text-[30px] font-semibold leading-none text-ink">
          {centerTop}
        </span>
        {centerBottom && (
          <span className="mt-1.5 text-[12px] text-muted">{centerBottom}</span>
        )}
      </div>
    </div>
  );
}
