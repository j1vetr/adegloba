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
      {visible.map((banner: any) => {
        const customMsg: string | null = banner.campaign?.customMessage || null;
        const giftDesc: string = banner.campaign?.giftDescription || `${banner.campaign?.giftDataGb ?? ''} GB Hediye`;

        return (
          <div
            key={banner.campaignId}
            className="relative flex items-start gap-3 bg-gradient-to-r from-[#FFF6D6] to-[#FFFBE8] border border-[#FFDD57]/60 rounded-2xl px-4 py-4 shadow-sm overflow-hidden"
          >
            {/* decorative circles */}
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#FFDD57]/20 pointer-events-none" />
            <div className="absolute -right-1 bottom-0 w-12 h-12 rounded-full bg-[#FFDD57]/10 pointer-events-none" />

            <div className="w-10 h-10 rounded-xl bg-[#FFDD57] flex items-center justify-center shrink-0 relative z-10">
              <Gift className="text-slate-900" style={{ width: 20, height: 20 }} />
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              {/* Campaign name + sparkle */}
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-slate-900 font-bold text-sm">{banner.campaign?.name || "Özel Hediye"}</p>
                <Sparkles className="w-3.5 h-3.5 text-[#7C5E00]" />
              </div>

              {/* Custom message — shown prominently if set */}
              {customMsg ? (
                <p className="text-slate-800 text-sm font-medium leading-snug mb-1">
                  {customMsg}
                </p>
              ) : (
                <p className="text-[#7C5E00] text-xs font-medium mb-1">
                  🎁 {giftDesc} hesabınıza tanımlandı!
                </p>
              )}

              {/* Sub-line: always show gift description when there's a custom message */}
              {customMsg && (
                <p className="text-[#7C5E00] text-xs font-medium mb-0.5">
                  🎁 {giftDesc} hesabınıza tanımlandı!
                </p>
              )}

              <p className="text-slate-400 text-xs">
                Paketlerim sayfasında görüntüleyebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => handleDismiss(banner.campaignId)}
              className="shrink-0 w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300/70 flex items-center justify-center transition relative z-10 mt-0.5"
              aria-label="Kapat"
            >
              <X className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
