import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./primitives";
import { IconX } from "./icons";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** When set, renders as a description below the title. */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Sticky footer, e.g. a primary action. */
  footer?: ReactNode;
}

/**
 * Bottom sheet — the app's primary modal surface. Traps focus loosely, closes
 * on Escape / scrim tap, and locks body scroll. Animates up on open.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="pm-scrim"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : "Dialog"}
          className="animate-sheet-up w-full max-w-app rounded-t-sheet bg-surface shadow-sheet outline-none safe-bottom"
        >
          <div className="flex justify-center pt-2.5">
            <div className="h-1 w-9 rounded-full bg-line" aria-hidden="true" />
          </div>
          {(title || subtitle) && (
            <div className="flex items-start justify-between gap-3 px-4 pt-2">
              <div className="min-w-0">
                {title && <h2 className="font-display text-[18px] text-ink">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-1 h-9 w-9 shrink-0">
                <IconX size={18} />
              </IconButton>
            </div>
          )}
          <div className="max-h-[70vh] overflow-y-auto px-4 py-3">{children}</div>
          {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
