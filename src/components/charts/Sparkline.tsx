interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Draw a faint baseline at this value (e.g. the personal average). */
  baseline?: number;
  tone?: "primary" | "normal" | "notice" | "info";
  ariaLabel?: string;
}

const TONE = {
  primary: "rgb(var(--pm-primary))",
  normal: "rgb(var(--pm-normal))",
  notice: "rgb(var(--pm-notice))",
  info: "rgb(var(--pm-info))",
};

/** Tiny trend line. Non-essential detail — always paired with a text summary. */
export function Sparkline({
  values,
  width = 240,
  height = 56,
  baseline,
  tone = "primary",
  ariaLabel,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <div
        className="flex h-14 items-center text-xs text-faint"
        role="img"
        aria-label={ariaLabel ?? "Not enough data to chart yet"}
      >
        Not enough data yet
      </div>
    );
  }
  const pad = 4;
  const all = baseline != null ? [...values, baseline] : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const areaD = `${d} L ${x(values.length - 1)} ${height - pad} L ${x(0)} ${height - pad} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel ?? "Trend line"}
      className="overflow-visible"
    >
      <path d={areaD} fill={TONE[tone]} opacity={0.08} />
      {baseline != null && (
        <line
          x1={pad}
          x2={width - pad}
          y1={y(baseline)}
          y2={y(baseline)}
          stroke="rgb(var(--pm-faint))"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      <path d={d} fill="none" stroke={TONE[tone]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3} fill={TONE[tone]} />
    </svg>
  );
}
