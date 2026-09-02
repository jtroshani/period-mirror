import type { ReactNode } from "react";

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Chip({ selected, onClick, children, icon, disabled, size = "md" }: ChipProps) {
  const sizing =
    size === "sm" ? "min-h-[32px] px-3 text-[13px]" : "min-h-[38px] px-3.5 text-[14px]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`pm-pressable inline-flex items-center gap-1.5 rounded-full border font-medium disabled:opacity-40 ${sizing} ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-line bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Single-select behaviour when true. */
  single?: boolean;
  label?: string;
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  single,
  label,
}: ChipGroupProps<T>) {
  const toggle = (v: T) => {
    if (single) {
      onChange(value.includes(v) ? [] : [v]);
      return;
    }
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div role="group" aria-label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip
            key={o.value}
            size="sm"
            selected={value.includes(o.value)}
            onClick={() => toggle(o.value)}
            icon={o.icon}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
