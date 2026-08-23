import { ChangeEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  PackagePlus,
  Radio,
  Ship,
  Trash2,
  Upload,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Credential = { username: string; password: string };
type LineIssue = { line: number; content: string };
type SetupPlan = {
  id: string;
  name: string;
  dataLimitGb: string;
  priceUsd: string;
  isActive: boolean;
  sortOrder: number;
  sourceText: string;
  fileName: string;
};

const STANDARD_PLANS = [
  { dataLimitGb: "1", priceUsd: "3.25" },
  { dataLimitGb: "5", priceUsd: "15" },
  { dataLimitGb: "10", priceUsd: "28" },
  { dataLimitGb: "25", priceUsd: "68" },
  { dataLimitGb: "50", priceUsd: "130" },
];

const newPlan = (limit = "", price = "", sortOrder = 0): SetupPlan => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  dataLimitGb: limit,
  priceUsd: price,
  isActive: true,
  sortOrder,
  sourceText: "",
  fileName: "",
});

function parseCredentials(sourceText: string) {
  const credentials: Credential[] = [];
  const malformed: LineIssue[] = [];
  sourceText.split(/\r?\n/).forEach((raw, index) => {
    const content = raw.trim();
    if (!content) return;
    const parts = content.split(",");
    const username = parts[0]?.trim() ?? "";
    const password = parts[1]?.trim() ?? "";
    if (parts.length !== 2 || !username || !password) {
      malformed.push({ line: index + 1, content: raw });
      return;
    }
    credentials.push({ username, password });
  });
  return { credentials, malformed };
}

export default function ShipSetupWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [ship, setShip] = useState({ name: "", kitNumber: "", isActive: true });
  const [sharedLabel, setSharedLabel] = useState("");
  const [plans, setPlans] = useState<SetupPlan[]>(() =>
    STANDARD_PLANS.map((plan, index) => newPlan(plan.dataLimitGb, plan.priceUsd, index + 1)),
  );

  const planDiagnostics = useMemo(() => {
    return plans.map((plan) => {
      const result = parseCredentials(plan.sourceText);
      const usernameCounts = new Map<string, number>();
      result.credentials.forEach((credential) => {
        usernameCounts.set(credential.username.toLocaleLowerCase("tr-TR"), (usernameCounts.get(credential.username.toLocaleLowerCase("tr-TR")) ?? 0) + 1);
      });
      return {
        ...result,
        duplicates: result.credentials.filter((credential) =>
          (usernameCounts.get(credential.username.toLocaleLowerCase("tr-TR")) ?? 0) > 1,
        ),
      };
    });
  }, [plans]);

  const malformedCount = planDiagnostics.reduce((total, item) => total + item.malformed.length, 0);
  const credentialCount = planDiagnostics.reduce((total, item) => total + item.credentials.length, 0);
  const duplicateCount = planDiagnostics.reduce(
    (total, item) => total + new Set(item.duplicates.map((credential) => credential.username.toLocaleLowerCase("tr-TR"))).size,
    0,
  );

  const updatePlan = (id: string, updates: Partial<SetupPlan>) =>
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan)));

  const applyLabel = (label: string) => {
    setSharedLabel(label);
    const normalized = label.trim().toLocaleUpperCase("tr-TR");
    if (!normalized) return;
    setPlans((current) =>
      current.map((plan) => ({
        ...plan,
        name: `${plan.dataLimitGb} GB İnternet Data - ${normalized}`,
      })),
    );
  };

  const handleFile = (planId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".txt")) {
      toast({ title: "Dosya türü uygun değil", description: "Yalnızca TXT dosyası yükleyin.", variant: "destructive" });
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updatePlan(planId, { sourceText: String(reader.result ?? ""), fileName: file.name });
    };
    reader.onerror = () => toast({ title: "Dosya okunamadı", description: "TXT dosyasını yeniden seçin.", variant: "destructive" });
    reader.readAsText(file);
    event.target.value = "";
  };

  const detailsValid = ship.name.trim().length > 0;
  const plansValid = plans.length > 0 && plans.every((plan) =>
    plan.name.trim() && Number.isInteger(Number(plan.dataLimitGb)) && Number(plan.dataLimitGb) > 0 && Number(plan.priceUsd) > 0,
  );
  const canSubmit = detailsValid && plansValid && malformedCount === 0 && duplicateCount === 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ship: { name: ship.name.trim(), ...(ship.kitNumber.trim() ? { kitNumber: ship.kitNumber.trim() } : {}), isActive: ship.isActive },
        plans: plans.map((plan, index) => ({
          clientId: plan.id,
          name: plan.name.trim(),
          dataLimitGb: Number(plan.dataLimitGb),
          priceUsd: Number(plan.priceUsd),
          isActive: plan.isActive,
          sortOrder: index + 1,
          credentials: parseCredentials(plan.sourceText).credentials,
        })),
      };
      const response = await apiRequest("POST", "/api/admin/ships/setup", payload);
      return response.json() as Promise<{ ship: { name: string }; plans: Array<{ credentialCount: number }>; totalCredentials: number }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credentials"] });
      toast({
        title: "Kurulum tamamlandı",
        description: `${result.ship.name} için ${result.plans.length} paket ve ${result.totalCredentials} kimlik bilgisi kaydedildi.`,
      });
      setLocation("/admin/ships");
    },
    onError: (error: Error) => toast({ title: "Kurulum kaydedilemedi", description: error.message, variant: "destructive" }),
  });

  const next = () => {
    if (step === 1 && !detailsValid) {
      toast({ title: "Eksik bilgi", description: "Gemi adını girin.", variant: "destructive" });
      return;
    }
    if (step === 2 && !plansValid) {
      toast({ title: "Paketleri kontrol edin", description: "Her paket için ad, veri limiti ve fiyat gereklidir.", variant: "destructive" });
      return;
    }
    if (step === 3 && (malformedCount > 0 || duplicateCount > 0)) {
      toast({ title: "Kimlik dosyalarını kontrol edin", description: "Hatalı satırları ve yinelenen kullanıcı adlarını düzeltin.", variant: "destructive" });
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  };

  return (
    <AdminLayout title="Gemi Kurulumu">
      <div className="mx-auto max-w-6xl space-y-5 pb-12">
        <header className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 px-5 py-5 shadow-2xl shadow-cyan-950/20 sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <Radio className="h-4 w-4" /> Operasyon merkezi
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Gemi ve paket kurulumu</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Tek akışta gemiyi, satış paketlerini ve portal kimlik havuzlarını hazır hale getirin.</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/admin/ships")} className="border-slate-600 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Gemi listesine dön
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-700/70 pt-4 sm:grid-cols-4">
            {["Gemi", "Paketler", "Kimlikler", "Kontrol"].map((label, index) => {
              const active = step === index + 1;
              const complete = step > index + 1;
              return <button type="button" key={label} onClick={() => (complete ? setStep(index + 1) : undefined)} className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors ${active ? "bg-cyan-400/10 text-cyan-200" : complete ? "cursor-pointer text-emerald-300 hover:bg-emerald-400/10" : "text-slate-500"}`}>
                {complete ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${active ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-700"}`}>{index + 1}</span>}
                <span className="font-semibold">{label}</span>
              </button>;
            })}
          </div>
        </header>

        {step === 1 && <Card className="border-cyan-400/15 bg-slate-900/80 shadow-xl shadow-slate-950/30"><CardContent className="p-5 sm:p-7">
          <div className="mb-6 flex items-start gap-3"><div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300"><Ship className="h-5 w-5" /></div><div><h2 className="font-semibold text-white">Gemi kimliği</h2><p className="mt-1 text-sm text-slate-400">Bu bilgiler tüm paket ve kimlik kayıtlarının ana referansı olur.</p></div></div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="ship-name" className="text-slate-200">Gemi adı</Label><Input id="ship-name" value={ship.name} onChange={(event) => setShip({ ...ship, name: event.target.value })} placeholder="Örnek: Mavi Yıldız" className="admin-input" autoFocus /><p className="text-xs text-slate-500">Gerekli alan</p></div>
            <div className="space-y-2"><Label htmlFor="kit-number" className="text-slate-200">KIT numarası</Label><Input id="kit-number" value={ship.kitNumber} onChange={(event) => setShip({ ...ship, kitNumber: event.target.value })} placeholder="Örnek: KIT-2025-014" className="admin-input" /><p className="text-xs text-slate-500">Boş bırakılabilir</p></div>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3"><div><p className="text-sm font-medium text-slate-200">Satışta görünür</p><p className="mt-0.5 text-xs text-slate-500">Gemi kayıt ekranında kullanılabilir olur.</p></div><Switch checked={ship.isActive} onCheckedChange={(isActive) => setShip({ ...ship, isActive })} /></div>
        </CardContent></Card>}

        {step === 2 && <div className="space-y-4">
          <Card className="border-cyan-400/15 bg-slate-900/80"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="font-semibold text-white">Paket şablonu</h2><p className="mt-1 text-sm text-slate-400">Ortak etiketi girin, standart paket adları otomatik kurulsun.</p></div>
            <div className="w-full sm:w-80"><Label htmlFor="shared-label" className="mb-2 block text-xs text-slate-300">Ortak paket etiketi</Label><Input id="shared-label" value={sharedLabel} onChange={(event) => applyLabel(event.target.value)} placeholder="Örnek: Lider" className="admin-input" /></div>
          </CardContent></Card>
          <div className="space-y-3">
            {plans.map((plan, index) => <Card key={plan.id} className="group border-slate-700/80 bg-slate-900/75 transition-colors hover:border-cyan-400/35"><CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-cyan-300">#{index + 1}</span><span className="text-sm font-medium text-slate-200">{plan.dataLimitGb || "Yeni"} GB paket</span></div><div className="flex items-center gap-2"><Switch checked={plan.isActive} onCheckedChange={(isActive) => updatePlan(plan.id, { isActive })} /><Button variant="ghost" size="icon" onClick={() => setPlans((current) => current.filter((item) => item.id !== plan.id))} className="h-8 w-8 text-slate-500 hover:bg-red-500/10 hover:text-red-300" aria-label="Paketi kaldır"><Trash2 className="h-4 w-4" /></Button></div></div>
               <div className="grid gap-3 md:grid-cols-9"><div className="md:col-span-5"><Label className="text-xs text-slate-400">Paket adı</Label><Input value={plan.name} onChange={(event) => updatePlan(plan.id, { name: event.target.value })} className="admin-input mt-1" placeholder="Paket adı" /></div><div className="md:col-span-2"><Label className="text-xs text-slate-400">Veri GB</Label><Input type="number" min="1" step="1" value={plan.dataLimitGb} onChange={(event) => updatePlan(plan.id, { dataLimitGb: event.target.value })} className="admin-input mt-1" /></div><div className="md:col-span-2"><Label className="text-xs text-slate-400">USD fiyatı</Label><Input type="number" min="0.01" step="0.01" value={plan.priceUsd} onChange={(event) => updatePlan(plan.id, { priceUsd: event.target.value })} className="admin-input mt-1" /></div></div>
            </CardContent></Card>)}
          </div>
          <Button variant="outline" onClick={() => setPlans((current) => [...current, newPlan("", "", current.length + 1)])} className="w-full border-dashed border-slate-600 bg-slate-900/40 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/5 hover:text-cyan-200"><PackagePlus className="mr-2 h-4 w-4" /> Özel paket ekle</Button>
        </div>}

        {step === 3 && <div className="space-y-4">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p>Her TXT dosyasında satırlar <code className="rounded bg-slate-950/50 px-1.5 py-0.5 text-amber-200">kullaniciadi,sifre</code> biçiminde olmalı. Hatalı satırlar kayıt işlemini durdurur.</p></div></div>
          {plans.map((plan, index) => { const diagnostic = planDiagnostics[index]; return <Card key={plan.id} className={`border ${diagnostic.malformed.length ? "border-red-400/40" : "border-slate-700/80"} bg-slate-900/80`}><CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium text-white">{plan.name || `${plan.dataLimitGb} GB paket`}</h2><p className="mt-1 text-xs text-slate-500">{plan.fileName || "TXT dosyası seçilmedi"}</p></div><label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"><Upload className="mr-2 h-4 w-4" /> TXT yükle<input type="file" accept=".txt,text/plain" onChange={(event) => handleFile(plan.id, event)} className="hidden" /></label></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-lg bg-emerald-400/10 px-3 py-2"><p className="text-xs text-emerald-300">Geçerli</p><p className="mt-1 text-lg font-semibold text-white">{diagnostic.credentials.length}</p></div><div className={`rounded-lg px-3 py-2 ${diagnostic.malformed.length ? "bg-red-400/10" : "bg-slate-800/70"}`}><p className={`text-xs ${diagnostic.malformed.length ? "text-red-300" : "text-slate-400"}`}>Hatalı satır</p><p className="mt-1 text-lg font-semibold text-white">{diagnostic.malformed.length}</p></div><div className={`rounded-lg px-3 py-2 ${diagnostic.duplicates.length ? "bg-amber-400/10" : "bg-slate-800/70"}`}><p className={`text-xs ${diagnostic.duplicates.length ? "text-amber-300" : "text-slate-400"}`}>Yinelenen kullanıcı</p><p className="mt-1 text-lg font-semibold text-white">{diagnostic.duplicates.length}</p></div></div>
            {(diagnostic.credentials.length > 0 || diagnostic.malformed.length > 0 || diagnostic.duplicates.length > 0) && <div className="mt-3 grid gap-3 border-t border-slate-800 pt-3 text-xs md:grid-cols-3">
              <div>{diagnostic.credentials.slice(0, 3).map((credential) => <p key={credential.username} className="truncate text-emerald-300">Geçerli kullanıcı: {credential.username}</p>)}</div>
              <div>{diagnostic.malformed.slice(0, 3).map((issue) => <p key={`${issue.line}-${issue.content}`} className="text-red-300">Satır {issue.line} uygun değil: {issue.content || "boş"}</p>)}</div>
              <div>{diagnostic.duplicates.slice(0, 3).map((credential) => <p key={credential.username} className="text-amber-300">Yinelenen kullanıcı: {credential.username}</p>)}</div>
            </div>}
          </CardContent></Card>; })}
        </div>}

        {step === 4 && <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]"><Card className="border-cyan-400/20 bg-slate-900/85"><CardContent className="p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300"><FileText className="h-5 w-5" /></div><div><h2 className="font-semibold text-white">Gönderim özeti</h2><p className="mt-1 text-sm text-slate-400">Kaydedildiğinde gemi, paketler ve geçerli kimlik bilgileri birlikte oluşturulur.</p></div></div><div className="mt-6 divide-y divide-slate-800 rounded-xl border border-slate-700/70"><div className="flex items-center justify-between p-4"><div><p className="text-xs text-slate-500">Gemi</p><p className="mt-1 font-medium text-white">{ship.name || "Girilmedi"}</p></div><Badge className={ship.isActive ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-slate-600 bg-slate-800 text-slate-300"}>{ship.isActive ? "Aktif" : "Pasif"}</Badge></div>{plans.map((plan, index) => <div key={plan.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{plan.name}</p><p className="mt-1 text-xs text-slate-500">{plan.dataLimitGb} GB · ${plan.priceUsd} · {planDiagnostics[index].credentials.length} kimlik</p></div><Badge variant="outline" className={plan.isActive ? "border-emerald-400/30 text-emerald-200" : "border-slate-600 text-slate-400"}>{plan.isActive ? "Aktif" : "Pasif"}</Badge></div>)}</div></CardContent></Card>
          <Card className={`${canSubmit ? "border-emerald-400/25" : "border-red-400/30"} bg-slate-900/85`}><CardContent className="p-5"><h2 className="font-semibold text-white">Kontrol durumu</h2><div className="mt-5 space-y-3 text-sm"><div className="flex items-center justify-between"><span className="text-slate-400">Paketler</span><span className={plansValid ? "text-emerald-300" : "text-red-300"}>{plans.length} kayıt</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Kimlikler</span><span className="text-slate-200">{credentialCount} kayıt</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Hatalı satırlar</span><span className={malformedCount ? "text-red-300" : "text-emerald-300"}>{malformedCount}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Yinelenen kullanıcılar</span><span className={duplicateCount ? "text-red-300" : "text-emerald-300"}>{duplicateCount}</span></div></div><div className={`mt-6 rounded-lg p-3 text-xs ${canSubmit ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"}`}>{canSubmit ? "Kayıt için tüm kontroller tamamlandı." : "Kaydetmeden önce işaretli sorunları çözün."}</div></CardContent></Card></div>}

        <footer className="sticky bottom-3 z-10 flex items-center justify-between rounded-xl border border-slate-700/90 bg-slate-950/95 p-3 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <Button variant="ghost" disabled={step === 1 || submitMutation.isPending} onClick={() => setStep((current) => current - 1)} className="text-slate-300 hover:bg-slate-800 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
          {step < 4 ? <Button onClick={next} className="bg-cyan-500 text-slate-950 hover:bg-cyan-300">Devam et <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button disabled={!canSubmit || submitMutation.isPending} onClick={() => submitMutation.mutate()} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400">{submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}{submitMutation.isPending ? "Kaydediliyor" : "Kurulumu kaydet"}</Button>}
        </footer>
      </div>
    </AdminLayout>
  );
}