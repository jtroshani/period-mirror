interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: SegmentedControlProps<T>) {
  const sm = size === "sm";
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`inline-flex w-full rounded-xl bg-surface-2 p-0.5 ${sm ? "text-[11px]" : "text-[13px]"}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`pm-pressable min-w-0 flex-1 truncate rounded-[0.6rem] font-semibold transition-colors ${
              sm ? "px-1 py-1.5" : "px-2.5 py-2"
            } ${active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
