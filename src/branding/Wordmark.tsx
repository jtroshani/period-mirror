import { brand } from "./brand";

interface WordmarkProps {
  size?: "sm" | "md" | "lg";
  withMark?: boolean;
  className?: string;
}

const TEXT_SIZE = { sm: "text-base", md: "text-xl", lg: "text-2xl" } as const;
const MARK_SIZE = { sm: 20, md: 26, lg: 34 } as const;

/** Temporary minimalist wordmark. Mark = a circle (the mirror) with a
 *  reflective arc; wordmark splits weight between the two words. */
export function Wordmark({
  size = "md",
  withMark = true,
  className = "",
}: WordmarkProps) {
  const [first, second] = brand.name.split(" ");
  const s = MARK_SIZE[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {withMark && (
        <svg
          width={s}
          height={s}
          viewBox="0 0 34 34"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle
            cx="17"
            cy="17"
            r="12.5"
            stroke="rgb(var(--pm-primary))"
            strokeWidth="2.4"
          />
          <path
            d="M17 4.5a12.5 12.5 0 0 0 0 25"
            stroke="rgb(var(--pm-accent))"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="17" cy="17" r="4" fill="rgb(var(--pm-primary))" />
        </svg>
      )}
      <span
        className={`font-display ${TEXT_SIZE[size]} leading-none tracking-tight text-ink`}
      >
        <span className="font-normal">{first}</span>{" "}
        <span className="font-semibold">{second}</span>
      </span>
    </span>
  );
}
