interface MiniBarsProps {
  data: { label: string; value: number; highlight?: boolean }[];
  max?: number;
  unit?: string;
  height?: number;
  ariaLabel?: string;
}

const BAR_COLORS = [
  "rgb(var(--pm-phase-menstrual))",
  "rgb(var(--pm-phase-follicular))",
  "rgb(var(--pm-phase-ovulation))",
  "rgb(var(--pm-phase-luteal))",
];

/** Rounded vertical bar chart — bright, legible, phase-tinted. */
export function MiniBars({ data, max, unit, height = 96, ariaLabel }: MiniBarsProps) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="img" aria-label={ariaLabel ?? "Bar chart"}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[9px] font-semibold text-muted">
              {d.value > 0 ? Math.round(d.value * 10) / 10 : ""}
            </span>
            <div
              className="w-full rounded-full"
              style={{
                height: `${Math.max(6, (d.value / top) * (height - 16))}px`,
                backgroundColor: d.highlight
                  ? BAR_COLORS[i % BAR_COLORS.length]
                  : "rgb(var(--pm-primary-soft))",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-faint">
            {d.label}
          </span>
        ))}
      </div>
      {unit && <p className="mt-0.5 text-center text-[9px] text-faint">{unit}</p>}
    </div>
  );
}
