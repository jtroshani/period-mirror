interface ProgressRingProps {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: "primary" | "normal" | "accent";
}

const TONE = {
  primary: "rgb(var(--pm-primary))",
  normal: "rgb(var(--pm-normal))",
  accent: "rgb(var(--pm-accent))",
};

export function ProgressRing({
  progress,
  size = 132,
  stroke = 10,
  label,
  sublabel,
  tone = "primary",
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--pm-line))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && <span className="font-display text-2xl leading-none text-ink">{label}</span>}
        {sublabel && <span className="mt-1 px-2 text-[11px] leading-tight text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
