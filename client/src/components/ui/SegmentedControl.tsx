import { ReactNode, useRef, KeyboardEvent } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  testId?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  ariaLabel,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIdx = (i: number) => {
    const len = options.length;
    const next = ((i % len) + len) % len;
    const btn = refs.current[next];
    if (btn) {
      btn.focus();
      onChange(options[next].value);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusIdx(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusIdx(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusIdx(0);
        break;
      case "End":
        e.preventDefault();
        focusIdx(options.length - 1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        onChange(options[idx].value);
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid gap-1.5 p-1.5 bg-slate-100 rounded-2xl ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            data-testid={opt.testId}
            className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD57] focus-visible:ring-offset-1 ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
