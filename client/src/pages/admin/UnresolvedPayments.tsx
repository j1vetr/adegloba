import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, RefreshCw, AlertTriangle, CheckCircle2, User, Package, CreditCard,
} from "lucide-react";

interface Candidate {
  id: string;
  status: string;
  totalUsd: string | null;
  createdAt: string | null;
  user: { id: string; username: string; email: string | null; fullName: string | null } | null;
}

interface UnresolvedItem {
  logId: string;
  type: "ambiguous_recovery_blocked" | "webhook_orphan_payment";
  createdAt: string | null;
  paypalOrderId: string | null;
  amount: string | null;
  paymentId: string | null;
  reason: string | null;
  candidates: Candidate[];
}

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  ambiguous_recovery_blocked: {
    label: "Belirsiz Eşleşme",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  webhook_orphan_payment: {
    label: "Sahipsiz Ödeme",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

function formatDate(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ItemCard({ item }: { item: UnresolvedItem }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    item.candidates.length === 1 ? item.candidates[0].id : ""
  );
  const [manualOrderId, setManualOrderId] = useState("");

  const resolveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/unresolved-payments/${item.logId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Çözümleme başarısız");
      return body;
    },
    onSuccess: (data) => {
      toast({
        title: "Teslimat tamamlandı",
        description: `Sipariş ödendi olarak işaretlendi, ${data.credentialsAssigned} kimlik bilgisi atandı.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unresolved-payments"] });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  const orderIdToResolve = selectedOrderId || manualOrderId.trim();
  const typeInfo = TYPE_LABELS[item.type];

  return (
    <Card className="bg-slate-900/60 border-slate-700/60 p-5 space-y-4" data-testid={`card-unresolved-${item.logId}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className={typeInfo.className}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {typeInfo.label}
        </Badge>
        <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
        {item.amount && (
          <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5" /> {item.amount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-500">PayPal Order ID: </span>
          <span className="text-slate-200 font-mono text-xs" data-testid={`text-paypal-order-${item.logId}`}>
            {item.paypalOrderId || "-"}
          </span>
        </div>
        {item.paymentId && (
          <div>
            <span className="text-slate-500">Payment ID: </span>
            <span className="text-slate-200 font-mono text-xs">{item.paymentId}</span>
          </div>
        )}
      </div>

      {item.reason && <p className="text-xs text-slate-400 italic">{item.reason}</p>}

      {item.candidates.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300 flex items-center gap-1">
            <Package className="h-4 w-4 text-cyan-400" /> Aday Siparişler — doğru olanı seçin:
          </p>
          {item.candidates.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                selectedOrderId === c.id
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-slate-700 hover:border-slate-500"
              }`}
              data-testid={`option-candidate-${c.id}`}
            >
              <input
                type="radio"
                name={`candidate-${item.logId}`}
                checked={selectedOrderId === c.id}
                onChange={() => setSelectedOrderId(c.id)}
                className="accent-cyan-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-slate-300">{c.id.substring(0, 8).toUpperCase()}</span>
                  <Badge variant="outline" className="text-xs">{c.status}</Badge>
                  {c.totalUsd && <span className="text-emerald-400 font-semibold">${c.totalUsd}</span>}
                  <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                </div>
                {c.user && (
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {c.user.fullName || c.user.username}
                    {c.user.email ? ` — ${c.user.email}` : ""}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">
            Aday sipariş bulunamadı. Teslimatı tamamlamak için sipariş ID girin:
          </p>
          <Input
            value={manualOrderId}
            onChange={(e) => setManualOrderId(e.target.value)}
            placeholder="Sipariş ID (UUID)"
            className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-xs"
            data-testid={`input-manual-order-${item.logId}`}
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button
          disabled={!orderIdToResolve || resolveMutation.isPending}
          onClick={() => resolveMutation.mutate(orderIdToResolve)}
          className="bg-emerald-600 hover:bg-emerald-500"
          data-testid={`button-resolve-${item.logId}`}
        >
          {resolveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Teslimatı Tamamla
        </Button>
      </div>
    </Card>
  );
}

export default function UnresolvedPayments() {
  const { data, isLoading, refetch, isFetching } = useQuery<{ items: UnresolvedItem[] }>({
    queryKey: ["/api/admin/unresolved-payments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/unresolved-payments");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const items = data?.items ?? [];

  return (
    <AdminLayout title="Çözüm Bekleyen Ödemeler">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
              Çözüm Bekleyen Ödemeler
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              PayPal'dan para çekilmiş ancak siparişle eşleştirilememiş ödemeler. Doğru siparişi seçip teslimatı tamamlayın.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : items.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-700/60 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Çözüm bekleyen ödeme yok</p>
            <p className="text-sm text-slate-500 mt-1">
              Tüm ödemeler siparişlerle eşleştirilmiş durumda.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <ItemCard key={item.logId} item={item} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
