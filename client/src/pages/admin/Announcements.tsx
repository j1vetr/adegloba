import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BellRing,
  CalendarClock,
  Check,
  Eye,
  Globe2,
  LoaderCircle,
  Save,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { Announcement, AnnouncementInput, AnnouncementLanguage } from "@shared/announcement";
import { defaultAnnouncement } from "@shared/announcement";
import AdminLayout from "@/components/AdminLayout";
import AnnouncementDialog from "@/components/announcements/AnnouncementDialog";
import RichTextEditor from "@/components/announcements/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const queryKey = ["/api/admin/announcement"];
type FormState = Omit<AnnouncementInput, "resetSeen">;
const languageOptions: { key: AnnouncementLanguage; label: string; descriptor: string }[] = [
  { key: "tr", label: "Türkçe", descriptor: "Varsayılan dil" },
  { key: "en", label: "English", descriptor: "English translation" },
];

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function textOnly(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "").trim();
  const node = document.createElement("div");
  node.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return (node.textContent || "").trim();
}

function copyForm(form: FormState | Announcement): FormState {
  return {
    enabled: form.enabled,
    displayMode: form.displayMode,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    translations: {
      tr: { ...form.translations.tr },
      en: { ...form.translations.en },
    },
  };
}

function toPreviewAnnouncement(form: FormState, current: Announcement | undefined): Announcement {
  return {
    ...form,
    version: current?.version || "preview",
    updatedAt: current?.updatedAt || null,
  };
}

export default function Announcements() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => copyForm(defaultAnnouncement));
  const [activeLanguage, setActiveLanguage] = useState<AnnouncementLanguage>("tr");
  const [resetSeen, setResetSeen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const announcementQuery = useQuery<Announcement>({
    queryKey,
    queryFn: async () => {
      const response = await fetch("/api/admin/announcement", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Duyurular yüklenemedi.");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!announcementQuery.data) return;
    const next = copyForm(announcementQuery.data);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setResetSeen(false);
  }, [announcementQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AnnouncementInput) => {
      const response = await apiRequest("PUT", "/api/admin/announcement", payload);
      return response.json() as Promise<Announcement>;
    },
    onSuccess: (saved) => {
      const next = copyForm(saved);
      setForm(next);
      setSavedSnapshot(JSON.stringify(next));
      setResetSeen(false);
      setFormError(null);
      queryClient.setQueryData(queryKey, saved);
      toast({
        title: "Duyuru kaydedildi",
        description: saved.enabled ? "Yayın ayarları güncellendi." : "Duyuru taslak olarak kaydedildi.",
      });
    },
    onError: (error: Error) => {
      setFormError(error.message || "Duyuru kaydedilemedi. Yeniden deneyin.");
      toast({ title: "Kaydetme başarısız", description: error.message, variant: "destructive" });
    },
  });

  const isDirty = useMemo(
    () => savedSnapshot !== null && JSON.stringify(form) !== savedSnapshot,
    [form, savedSnapshot],
  );
  const hasAnyContent = Object.values(form.translations).some(
    (translation) => translation.title.trim() || textOnly(translation.content),
  );
  const completeness = ["tr", "en"].filter((key) => {
    const translation = form.translations[key as AnnouncementLanguage];
    return translation.title.trim() && textOnly(translation.content);
  }).length;
  const currentTranslation = form.translations[activeLanguage];
  const invalidDates = !!form.startsAt && !!form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt);
  const canPreview = hasAnyContent || form.enabled;

  const updateTranslation = (field: "title" | "content", value: string) => {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLanguage]: { ...current.translations[activeLanguage], [field]: value },
      },
    }));
    setFormError(null);
  };

  const validate = () => {
    if (form.enabled && completeness < 2) {
      return "Yayınlamak için Türkçe ve İngilizce başlık ile içerik alanları zorunludur.";
    }
    if (invalidDates) return "Bitiş tarihi başlangıç tarihinden sonra olmalıdır.";
    if (form.translations.tr.title.length > 160 || form.translations.en.title.length > 160) {
      return "Başlıklar en fazla 160 karakter olabilir.";
    }
    if (form.translations.tr.content.length > 30000 || form.translations.en.content.length > 30000) {
      return "İçerik en fazla 30.000 karakter olabilir.";
    }
    return null;
  };

  const save = () => {
    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }
    const payload: AnnouncementInput = {
      ...copyForm(form),
      resetSeen,
    };
    saveMutation.mutate(payload);
  };

  const statusLabel = form.enabled
    ? form.endsAt && new Date(form.endsAt) <= new Date()
      ? "Süresi doldu"
      : form.startsAt && new Date(form.startsAt) > new Date()
        ? "Zamanlandı"
        : "Yayın etkin"
    : hasAnyContent
      ? "Taslak"
      : "Henüz içerik yok";
  const preview = toPreviewAnnouncement(form, announcementQuery.data);

  return (
    <AdminLayout title="Duyuru Paneli">
      <div className="mx-auto max-w-6xl pb-10">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#102938] via-slate-900 to-[#101923] p-5 sm:p-7">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-cyan-400/10" />
          <div className="absolute -right-2 -top-8 h-40 w-40 rounded-full border border-cyan-400/10" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <RadioTowerMark />
                Operasyon iletişimi
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Duyuru Paneli</h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                Gemideki kullanıcıların girişinde göreceği bilgilendirmeyi Türkçe ve İngilizce olarak yönetin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                form.enabled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-800/70 text-slate-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${form.enabled ? "bg-emerald-400" : "bg-slate-500"}`} />
                {statusLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                disabled={!canPreview}
                className="border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <Eye className="mr-2 h-4 w-4" />
                Önizle
              </Button>
            </div>
          </div>
          <div className="relative mt-6 grid max-w-lg grid-cols-2 gap-3 border-t border-slate-700/70 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Dil durumu</p>
              <p className="mt-1 text-sm font-medium text-slate-200">{completeness}/2 diller hazır</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Son kayıt</p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {announcementQuery.data?.updatedAt
                  ? new Date(announcementQuery.data.updatedAt).toLocaleString("tr-TR")
                  : "Henüz kaydedilmedi"}
              </p>
            </div>
          </div>
        </div>

        {announcementQuery.isLoading ? (
          <div className="space-y-4" aria-label="Duyuru yükleniyor">
            <div className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
            <div className="h-[460px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
          </div>
        ) : announcementQuery.isError ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-rose-300" />
              <div>
                <h2 className="font-semibold text-rose-100">Duyuru bilgisi alınamadı</h2>
                <p className="mt-1 text-sm text-rose-200/70">{announcementQuery.error.message}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => announcementQuery.refetch()}
                  className="mt-4 border-rose-400/30 text-rose-100 hover:bg-rose-500/10"
                >
                  Yeniden dene
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-100">İçerik ve diller</h2>
                    <p className="mt-0.5 text-xs text-slate-500">İki dil için başlık ve biçimlendirilmiş metin ekleyin.</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2" role="tablist" aria-label="Duyuru düzenleme dili">
                  {languageOptions.map((language) => {
                    const selected = language.key === activeLanguage;
                    const ready = !!form.translations[language.key].title.trim() && !!textOnly(form.translations[language.key].content);
                    return (
                      <button
                        key={language.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActiveLanguage(language.key)}
                        className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          selected ? "border-cyan-500/50 bg-cyan-500/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        }`}
                      >
                        <span>
                          <span className={`block text-sm font-semibold ${selected ? "text-cyan-200" : "text-slate-300"}`}>{language.label}</span>
                          <span className="mt-0.5 block text-[10px] text-slate-500">{language.descriptor}</span>
                        </span>
                        {ready ? <Check className="h-4 w-4 shrink-0 text-emerald-400" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-slate-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`announcement-title-${activeLanguage}`} className="text-sm font-medium text-slate-200">
                      Başlık <span className="text-rose-300">*</span>
                    </Label>
                    <span className={`text-xs ${currentTranslation.title.length > 160 ? "text-rose-300" : "text-slate-500"}`}>
                      {currentTranslation.title.length}/160
                    </span>
                  </div>
                  <Input
                    id={`announcement-title-${activeLanguage}`}
                    value={currentTranslation.title}
                    maxLength={160}
                    onChange={(event) => updateTranslation("title", event.target.value)}
                    placeholder={activeLanguage === "tr" ? "Örn. Bağlantı bakım çalışması" : "For example, connectivity maintenance"}
                    className="h-12 border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`announcement-content-${activeLanguage}`} className="text-sm font-medium text-slate-200">
                      Duyuru metni <span className="text-rose-300">*</span>
                    </Label>
                    <span className="text-xs text-slate-500">En fazla 30.000 karakter</span>
                  </div>
                  <RichTextEditor
                    id={`announcement-content-${activeLanguage}`}
                    label={`${languageOptions.find((item) => item.key === activeLanguage)?.label} duyuru metni`}
                    value={currentTranslation.content}
                    onChange={(value) => updateTranslation("content", value)}
                    maxLength={30000}
                    placeholder={activeLanguage === "tr" ? "Duyuru içeriğini yazın…" : "Write the announcement…"}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Güvenli biçimlendirme ile yayınlanır
                </p>
                <div className="flex items-center gap-2">
                  {isDirty && <span className="mr-1 text-xs font-medium text-amber-300">Kaydedilmemiş değişiklikler</span>}
                  <Button
                    type="button"
                    onClick={save}
                    disabled={saveMutation.isPending || (!isDirty && !resetSeen)}
                    className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {saveMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {saveMutation.isPending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
                  </Button>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <BellRing className="h-4 w-4 text-cyan-300" />
                      Yayın durumu
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">Duyurunun kullanıcı ekranında görünmesini yönetin.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.enabled}
                    aria-label="Duyuruyu etkinleştir"
                    onClick={() => {
                      setForm((current) => ({ ...current, enabled: !current.enabled }));
                      setFormError(null);
                    }}
                    className={`rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      form.enabled ? "text-emerald-300" : "text-slate-600"
                    }`}
                  >
                    {form.enabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>
                {!form.enabled && (
                  <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs leading-5 text-slate-400">
                    Etkinleştirildiğinde her iki dilde başlık ve içerik zorunludur.
                  </p>
                )}

                <div className="mt-5 space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Görüntülenme sıklığı</Label>
                  {([
                    ["every_login", "Her girişte", "Kullanıcı yeni oturum açtığında gösterilir."],
                    ["always", "Her sayfa yenilendiğinde", "Her tam sayfa yüklenişinde gösterilir. Menü geçişlerinde tekrar açılmaz."],
                    ["once", "Yalnızca bir kez", "Kullanıcı başına bir kez gösterilir."],
                  ] as const).map(([value, label, description]) => (
                    <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                      form.displayMode === value ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="display-mode"
                        value={value}
                        checked={form.displayMode === value}
                        onChange={() => setForm((current) => ({ ...current, displayMode: value }))}
                        className="mt-0.5 accent-cyan-400"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-200">{label}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <input
                    type="checkbox"
                    checked={resetSeen}
                    onChange={(event) => setResetSeen(event.target.checked)}
                    className="mt-0.5 accent-amber-400"
                  />
                  <span>
                    <span className="block text-sm font-medium text-amber-100">Daha önce görenlere yeniden göster</span>
                    <span className="mt-1 block text-xs leading-5 text-amber-100/55">Kaydederken eski görüntülenme kayıtları sıfırlanır.</span>
                  </span>
                </label>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Başlık veya içerik değiştiğinde duyuru yeni sürüm olarak herkese yeniden gösterilir.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <CalendarClock className="h-4 w-4 text-cyan-300" />
                  Yayın takvimi
                </div>
                <p className="mb-4 text-xs leading-5 text-slate-500">
                  Boş bırakılan tarihler sınırsız kabul edilir. Saatler bu cihazın yerel saat dilimindedir.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="announcement-start" className="text-xs text-slate-300">Başlangıç</Label>
                    <Input
                      id="announcement-start"
                      type="datetime-local"
                      value={toLocalInput(form.startsAt)}
                      onChange={(event) => setForm((current) => ({ ...current, startsAt: fromLocalInput(event.target.value) }))}
                      className="border-slate-700 bg-slate-950/70 text-slate-200 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="announcement-end" className="text-xs text-slate-300">Bitiş</Label>
                    <Input
                      id="announcement-end"
                      type="datetime-local"
                      value={toLocalInput(form.endsAt)}
                      onChange={(event) => setForm((current) => ({ ...current, endsAt: fromLocalInput(event.target.value) }))}
                      className="border-slate-700 bg-slate-950/70 text-slate-200 [color-scheme:dark]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600">Yerel saat dilimi: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                  {invalidDates && <p role="alert" className="text-xs text-rose-300">Bitiş tarihi başlangıç tarihinden sonra olmalıdır.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <p className="text-xs leading-5 text-slate-500">
                    <span className="font-medium text-slate-300">Önizleme güvenlidir.</span> Değişiklikler kaydedilmeden kullanıcıya gösterilmez ve önizleme kapatıldığında görüntülenme kaydı oluşturulmaz.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        )}

        {formError && (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        {announcementQuery.data && (
          <AnnouncementDialog
            announcement={preview}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            preview
            initialLanguage={activeLanguage}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function RadioTowerMark() {
  return <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-[11px] text-cyan-300">A</span>;
}
