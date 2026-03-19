import { useState } from "react";
import { X, Star, Send, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeedbackModalProps {
  userId: string | number;
  onClose: () => void;
}

const SURVEY_QUESTIONS = [
  { key: "ease",    label: "Sistemi kullanmak ne kadar kolay?" },
  { key: "design",  label: "Tasarımı beğendiniz mi?" },
  { key: "payment", label: "Ödeme süreci nasıldı?" },
  { key: "overall", label: "Genel memnuniyetiniz?" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={`transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const STORAGE_KEY = (uid: string | number) => `feedback_done_${uid}`;

export function FeedbackModal({ userId, onClose }: FeedbackModalProps) {
  const { toast } = useToast();
  const [survey, setSurvey] = useState<Record<string, number>>({
    ease: 0, design: 0, payment: 0, overall: 0,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY(userId), "1");
    onClose();
  }

  async function handleSubmit() {
    const allAnswered = Object.values(survey).every((v) => v > 0);
    if (!allAnswered) {
      toast({ title: "Lütfen tüm soruları yanıtlayın", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/feedback", { survey, message });
      toast({ title: "Teşekkürler! Geri bildiriminiz iletildi." });
      localStorage.setItem(STORAGE_KEY(userId), "1");
      onClose();
    } catch {
      toast({ title: "Gönderilemedi, daha sonra tekrar deneyin.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1c35] via-[#0d1929] to-[#080c18]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                <MessageSquare size={18} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Geri Bildirim</h2>
                <p className="text-slate-400 text-xs mt-0.5">Deneyiminizi paylaşın, geliştirelim</p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Survey */}
          <div className="space-y-4 mb-5">
            {SURVEY_QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="text-slate-300 text-sm mb-2">{q.label}</p>
                <StarRating
                  value={survey[q.key]}
                  onChange={(v) => setSurvey((prev) => ({ ...prev, [q.key]: v }))}
                />
              </div>
            ))}
          </div>

          {/* Message textarea */}
          <div className="mb-5">
            <p className="text-slate-300 text-sm mb-2">Öneri veya mesajınız <span className="text-slate-500">(isteğe bağlı)</span></p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Neler eklemesini istersiniz? Neleri geliştirelim?"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Atla
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full" />
              ) : (
                <Send size={14} />
              )}
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useFeedbackModal(userId: string | number | undefined) {
  const key = userId ? STORAGE_KEY(userId) : null;
  const shouldShow = key ? !localStorage.getItem(key) : false;
  return shouldShow;
}
