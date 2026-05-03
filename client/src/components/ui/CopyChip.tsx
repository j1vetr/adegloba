import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CopyChipProps {
  value: string;
  label?: string;
  display?: string;
  className?: string;
  testId?: string;
}

export function CopyChip({ value, label, display, className = "", testId }: CopyChipProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: `${label || "Kopyalandı"}` });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Kopyalama başarısız", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={onCopy}
      data-testid={testId}
      className={`inline-flex items-center gap-2 px-2.5 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-700 transition ${className}`}
      aria-label={`${label || "Kopyala"}: ${value}`}
    >
      <span className="truncate max-w-[160px]">{display ?? value}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
    </button>
  );
}
