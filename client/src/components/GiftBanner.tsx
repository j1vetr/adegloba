import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Gift, X, Sparkles } from "lucide-react";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function GiftBanner() {
  const { user } = useUserAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: banners = [] } = useQuery<any[]>({
    queryKey: ["/api/user/gift-banners"],
    enabled: !!user,
    staleTime: 60000,
  });

  const dismissMut = useMutation({
    mutationFn: (campaignId: string) =>
      apiRequest("POST", `/api/user/gift-banners/${campaignId}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gift-banners"] });
    },
  });

  const handleDismiss = (campaignId: string) => {
    setDismissed(prev => new Set([...prev, campaignId]));
    dismissMut.mutate(campaignId);
  };

  const visible = banners.filter((b: any) => !dismissed.has(b.campaignId));
  if (!visible.length) return null;

  return (
    <div className="space-y-2 mb-3">
      {visible.map((banner: any) => (
        <div
          key={banner.campaignId}
          className="relative flex items-start gap-3 bg-gradient-to-r from-[#FFF6D6] to-[#FFFBE8] border border-[#FFDD57]/60 rounded-2xl px-4 py-3.5 shadow-sm overflow-hidden"
        >
          {/* decorative sparkle bg */}
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-[#FFDD57]/20 pointer-events-none" />
          <div className="absolute -right-1 bottom-0 w-10 h-10 rounded-full bg-[#FFDD57]/10 pointer-events-none" />

          <div className="w-9 h-9 rounded-xl bg-[#FFDD57] flex items-center justify-center shrink-0 relative z-10">
            <Gift className="w-4.5 h-4.5 text-slate-900" style={{ width: 18, height: 18 }} />
          </div>

          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-slate-900 font-bold text-sm">{banner.campaign?.name || "Özel Hediye"}</p>
              <Sparkles className="w-3.5 h-3.5 text-[#7C5E00]" />
            </div>
            <p className="text-[#7C5E00] text-xs font-medium">
              🎁 {banner.campaign?.giftDescription || `${banner.campaign?.giftDataGb} GB bonus`} hesabınıza tanımlandı!
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              Siparişlerim sayfasında görüntüleyebilirsiniz.
            </p>
          </div>

          <button
            onClick={() => handleDismiss(banner.campaignId)}
            className="shrink-0 w-6 h-6 rounded-full bg-slate-200/70 hover:bg-slate-300/70 flex items-center justify-center transition relative z-10"
            aria-label="Kapat"
          >
            <X className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      ))}
    </div>
  );
}
