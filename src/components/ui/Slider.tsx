import { useId } from "react";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Short words shown under the ends of the track. */
  ends?: [string, string];
  /** Formats the current value shown top-right. */
  format?: (value: number) => string;
  hint?: string;
}

/** Accessible themed range control with large touch target. */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  ends,
  format = (v) => `${v}`,
  hint,
}: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <span className="font-display text-[15px] text-primary">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        className="pm-range mt-2"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ backgroundSize: `${pct}% 100%` }}
        aria-valuetext={format(value)}
      />
      {ends && (
        <div className="mt-1 flex justify-between text-[11px] text-faint">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
