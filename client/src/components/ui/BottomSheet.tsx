import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: string;
  testId?: string;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = "90vh",
  testId,
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const root = dialogRef.current;
    const focusables = root?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables && focusables.length > 0 ? focusables[0] : root;
    requestAnimationFrame(() => first?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && root) {
        const f = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute("disabled")
        );
        if (f.length === 0) {
          e.preventDefault();
          root.focus();
          return;
        }
        const firstEl = f[0];
        const lastEl = f[f.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && active === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid={testId}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? titleId : undefined}
        tabIndex={-1}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 outline-none"
        style={{ maxHeight }}
      >
        <div className="mx-auto w-12 h-1 rounded-full bg-slate-200 mt-2.5 mb-1 sm:hidden" />
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div id={titleId} className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0 flex-1">
              {title}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Kapat"
              data-testid="button-bottom-sheet-close"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-slate-100 bottom-nav-safe">{footer}</div>
        )}
      </div>
    </div>
  );
}
