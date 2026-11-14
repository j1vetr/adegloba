import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { ArrowUpRight, BellRing, LoaderCircle, RadioTower } from "lucide-react";
import type { Announcement, AnnouncementLanguage } from "@shared/announcement";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnnouncementDialogProps {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: () => void;
  dismissPending?: boolean;
  dismissError?: string | null;
  preview?: boolean;
  initialLanguage?: AnnouncementLanguage;
}

const languages: { code: AnnouncementLanguage; label: string }[] = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
];

function cleanAnnouncementHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3",
      "ul", "ol", "li", "blockquote", "a", "hr", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

export default function AnnouncementDialog({
  announcement,
  open,
  onOpenChange,
  onDismiss,
  dismissPending = false,
  dismissError,
  preview = false,
  initialLanguage,
}: AnnouncementDialogProps) {
  const { language: appLanguage } = useLanguage();
  const [language, setLanguage] = useState<AnnouncementLanguage>("en");
  const translation = announcement.translations[language];
  const title = translation.title.trim() || (language === "tr" ? "Duyuru başlığı" : "Announcement title");
  const content = translation.content.trim()
    ? cleanAnnouncementHtml(translation.content)
    : `<p>${language === "tr" ? "Duyuru metni burada görüntülenecek." : "The announcement content will appear here."}</p>`;

  useEffect(() => {
    setLanguage(initialLanguage || (appLanguage === "tr" ? "tr" : "en"));
  }, [open, appLanguage, initialLanguage]);

  const close = () => {
    if (preview) {
      onOpenChange(false);
      return;
    }
    if (!dismissPending) onDismiss?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) onOpenChange(true);
        else if (preview) onOpenChange(false);
        else if (!dismissPending) onDismiss?.();
      }}
    >
      <DialogContent
        aria-describedby="announcement-dialog-description"
        className="fixed left-1/2 top-1/2 z-[100] flex max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[620px] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_24px_80px_rgba(7,25,42,0.28)] duration-200 [&>button]:right-4 [&>button]:top-4 [&>button]:text-slate-500 [&>button]:hover:text-slate-900 [&>button]:focus:ring-cyan-500 [&>button]:focus:ring-offset-white"
        onEscapeKeyDown={(event) => {
          if (dismissPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!preview) event.preventDefault();
        }}
      >
        <div className="shrink-0 border-b border-slate-100 bg-[#f4f8fa] px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          <div className="mb-5 flex items-start justify-between gap-4 pr-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#08384d] text-[#d3eb62]">
                <RadioTower className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  ADEGLOBA · STARLINK
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {language === "tr" ? "Kullanıcı duyurusu" : "Customer announcement"}
                </p>
              </div>
            </div>
            {preview && (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Önizleme
              </span>
            )}
          </div>
          <div className="flex gap-2" role="tablist" aria-label="Duyuru dili">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                role="tab"
                aria-selected={language === item.code}
                onClick={() => setLanguage(item.code)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 ${
                  language === item.code
                    ? "bg-[#08384d] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <DialogDescription id="announcement-dialog-description" className="sr-only">
            {language === "tr" ? "AdeGloba kullanıcı duyurusu" : "AdeGloba customer announcement"}
          </DialogDescription>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#638090]">
            <BellRing className="h-3.5 w-3.5" />
            {language === "tr" ? "Önemli bilgilendirme" : "Important update"}
          </div>
          <DialogTitle className="max-w-[520px] break-words text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#102f3f] sm:text-[32px]">
            {title}
          </DialogTitle>
          <div
            className="announcement-rich-content mt-5 break-words text-[15px] leading-7 text-slate-600 [&_p]:my-3 [&_strong]:font-bold [&_h2]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-sky-700 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-sky-200 [&_blockquote]:pl-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3 [&_hr]:my-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-8">
          {dismissError && (
            <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {dismissError}
            </p>
          )}
          <button
            type="button"
            onClick={close}
            disabled={dismissPending}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#08384d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0b4b63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          >
            {dismissPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
            {dismissPending
              ? language === "tr" ? "Kaydediliyor…" : "Saving…"
              : language === "tr" ? "Anladım, devam et" : "Got it, continue"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
