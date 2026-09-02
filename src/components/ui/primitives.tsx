import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
type ButtonSize = "md" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:opacity-95",
  secondary: "bg-primary-soft text-primary-ink hover:bg-primary-soft/70",
  ghost: "bg-transparent text-primary hover:bg-primary-soft/60",
  quiet: "bg-surface-2 text-ink hover:bg-surface-2/70",
  danger: "bg-alert-soft text-alert hover:bg-alert-soft/70",
};
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 text-[13px] rounded-lg",
  md: "min-h-[42px] px-4 text-[14px] rounded-xl",
  lg: "min-h-[48px] px-5 text-[15px] rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  icon,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`pm-pressable inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-40 disabled:pointer-events-none ${VARIANT[variant]} ${SIZE[size]} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------- IconButton */

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}
export function IconButton({ label, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`pm-pressable inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  inset?: boolean;
  padded?: boolean;
}
export function Card({
  as: Tag = "section",
  inset,
  padded = true,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`${inset ? "pm-inset" : "pm-card"} ${padded ? "p-3.5" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- SectionLabel */

export function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-0.5">
      <h2 className="text-[13px] font-semibold text-muted">{children}</h2>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------------- Badge */

type Tone = "neutral" | "primary" | "normal" | "notice" | "alert" | "info";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary-ink",
  normal: "bg-normal-soft text-normal",
  notice: "bg-notice-soft text-notice",
  alert: "bg-alert-soft text-alert",
  info: "bg-surface-2 text-info",
};
export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- StatValue */

export function StatValue({
  value,
  unit,
  caption,
  tone = "ink",
}: {
  value: ReactNode;
  unit?: string;
  caption?: ReactNode;
  tone?: "ink" | "primary" | "muted";
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "muted" ? "text-muted" : "text-ink";
  return (
    <div>
      <div className={`font-display text-xl leading-none ${toneClass}`}>
        {value}
        {unit && <span className="ml-0.5 text-[13px] text-faint">{unit}</span>}
      </div>
      {caption && <div className="mt-1 text-[11px] text-muted">{caption}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <p className="font-display text-lg text-ink">{title}</p>
      {body && <p className="max-w-[24rem] text-sm text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- Switch */

export function Switch({
  checked,
  onChange,
  label: lbl,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={lbl}
      onClick={() => onChange(!checked)}
      className={`pm-pressable relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full px-[3px] transition-colors ${
        checked ? "bg-primary" : "bg-line"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgb(28_25_23/0.25)] transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------- Divider */

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}

/* --------------------------------------------------------------------- Row */

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left ${
        onClick ? "pm-pressable hover:bg-surface-2/60" : ""
      }`}
    >
      {icon && <span className="shrink-0 text-muted">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block text-[12px] leading-tight text-muted">{subtitle}</span>}
      </span>
      {right && <span className="shrink-0 text-faint">{right}</span>}
    </Comp>
  );
}
