interface CycleRingProps {
  cycleLength: number;
  cycleDay: number;
  periodLength: number;
  /** Cycle-day range of the predicted fertile window, if it should be shown. */
  fertileWindow?: { startDay: number; endDay: number } | null;
  centerTop: string;
  centerBottom?: string;
  size?: number;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const [sx, sy] = polar(cx, cy, r, startDeg);
  const [ex, ey] = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

/**
 * Circular view of where the person is in the current cycle. Predicted regions
 * (fertile window, upcoming period) are visually lighter than recorded data.
 */
export function CycleRing({
  cycleLength,
  cycleDay,
  periodLength,
  fertileWindow,
  centerTop,
  centerBottom,
  size = 208,
}: CycleRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.round(size * 0.055);
  const r = (size - stroke * 2 - 4) / 2;
  const perDay = 360 / Math.max(cycleLength, 1);
  const clampedDay = Math.max(1, Math.min(cycleDay, cycleLength));
  const dayAngle = (clampedDay - 1) * perDay;
  const [dotX, dotY] = polar(cx, cy, r, dayAngle);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${centerTop}${centerBottom ? ", " + centerBottom : ""}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(var(--pm-line))" strokeWidth={stroke} />
        {/* menstrual arc — recorded */}
        <path
          d={arcPath(cx, cy, r, 0, Math.max(perDay, periodLength * perDay))}
          fill="none"
          stroke="rgb(var(--pm-primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* fertile window — predicted, lighter + dashed */}
        {fertileWindow && (
          <path
            d={arcPath(
              cx,
              cy,
              r,
              (fertileWindow.startDay - 1) * perDay,
              (fertileWindow.endDay - 1) * perDay,
            )}
            fill="none"
            stroke="rgb(var(--pm-accent))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="2 6"
            opacity={0.7}
          />
        )}
        {/* current-day marker */}
        <circle cx={dotX} cy={dotY} r={stroke * 0.7} fill="rgb(var(--pm-surface))" stroke="rgb(var(--pm-primary))" strokeWidth={3} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[26px] leading-none text-ink">{centerTop}</span>
        {centerBottom && <span className="mt-1 text-[11px] text-muted">{centerBottom}</span>}
      </div>
    </div>
  );
}
