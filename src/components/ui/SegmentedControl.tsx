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
      className={`inline-flex w-full rounded-full bg-primary-soft/50 p-1 ${
        sm ? "text-[11px]" : "text-[13px]"
      }`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`pm-pressable min-w-0 flex-1 truncate rounded-full font-semibold transition-colors ${
              sm ? "px-1.5 py-1.5" : "px-3 py-2"
            } ${active ? "bg-primary text-white shadow-pop" : "text-primary-ink/70 hover:text-primary-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
