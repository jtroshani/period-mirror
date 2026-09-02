import type { ReactNode } from "react";

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export function Chip({ selected, onClick, children, icon, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`pm-pressable inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium disabled:opacity-40 ${
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
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip
            key={o.value}
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
