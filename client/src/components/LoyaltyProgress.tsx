import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Star, Gift, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoyaltyStatus {
  currentGb: number;
  currentDiscount: number;
  nextTier: { neededGb: number; nextDiscount: number } | null;
  daysRemaining: number;
  tiers: { minGb: number; discountPercent: number }[];
}

export function LoyaltyProgress() {
  const { t, language } = useLanguage();
  
  const { data: loyalty, isLoading } = useQuery<LoyaltyStatus>({
    queryKey: ["/api/user/loyalty"],
  });

  if (isLoading) {
    return (
      <div className="glass-card p-4 rounded-xl animate-pulse" data-testid="loyalty-loading">
        <div className="h-20 bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  // Default loyalty tiers
  const defaultTiers = [
    { minGb: 25, discountPercent: 5 },
    { minGb: 50, discountPercent: 10 },
    { minGb: 100, discountPercent: 15 }
  ];

  const currentGb = loyalty?.currentGb || 0;
  const currentDiscount = loyalty?.currentDiscount || 0;
  const nextTier = loyalty?.nextTier || { neededGb: 25, nextDiscount: 5 };
  const daysRemaining = loyalty?.daysRemaining || Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const tiers = loyalty?.tiers || defaultTiers;
  
  const sortedTiers = [...tiers].sort((a, b) => a.minGb - b.minGb).filter(t => t.minGb > 0);
  const maxGb = sortedTiers[sortedTiers.length - 1]?.minGb || 100;
  const progressPercent = Math.min((currentGb / maxGb) * 100, 100);

  const getProgressMessage = () => {
    if (language === 'tr') {
      if (nextTier) {
        return `${nextTier.neededGb} GB daha alırsan %${nextTier.nextDiscount} indirim kazanırsın!`;
      }
      return `Maksimum indirim seviyesine ulaştınız! 🎉`;
    } else if (language === 'ru') {
      if (nextTier) {
        return `Купите ещё ${nextTier.neededGb} GB и получите ${nextTier.nextDiscount}% скидку!`;
      }
      return `Вы достигли максимального уровня скидки! 🎉`;
    } else {
      if (nextTier) {
        return `Buy ${nextTier.neededGb} GB more to get ${nextTier.nextDiscount}% discount!`;
      }
      return `You've reached the maximum discount level! 🎉`;
    }
  };

  const getDaysRemainingText = () => {
    if (language === 'tr') {
      return `${daysRemaining} gün kaldı`;
    } else if (language === 'ru') {
      return `${daysRemaining} дней осталось`;
    } else {
      return `${daysRemaining} days left`;
    }
  };

  const getMonthlyBonusText = () => {
    if (language === 'tr') {
      return 'Aylık Sadakat Bonusu';
    } else if (language === 'ru') {
      return 'Ежемесячный Бонус Лояльности';
    } else {
      return 'Monthly Loyalty Bonus';
    }
  };

  const getCurrentDiscountText = () => {
    if (language === 'tr') {
      return 'Mevcut İndiriminiz';
    } else if (language === 'ru') {
      return 'Ваша Текущая Скидка';
    } else {
      return 'Your Current Discount';
    }
  };

  const getThisMonthText = () => {
    if (language === 'tr') {
      return 'Bu ay toplam';
    } else if (language === 'ru') {
      return 'В этом месяце';
    } else {
      return 'This month total';
    }
  };

  return (
    <div className="glass-card p-3 sm:p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 overflow-hidden" data-testid="loyalty-progress">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex-shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-white truncate">{getMonthlyBonusText()}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400">{getDaysRemainingText()}</p>
          </div>
        </div>
        
        {currentDiscount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 self-start sm:self-auto">
            <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-xs sm:text-sm font-bold text-green-400">%{currentDiscount}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap justify-between text-[10px] sm:text-xs text-gray-400 mb-2 gap-1">
        <span className="whitespace-nowrap">{getThisMonthText()}: {currentGb} GB</span>
        <span className="whitespace-nowrap">{getCurrentDiscountText()}: %{currentDiscount}</span>
      </div>
      
      {/* Progress Bar - simple version without overflow markers */}
      <div className="mb-3">
        <Progress value={progressPercent} className="h-2 bg-gray-700/50" />
      </div>

      {/* Next Tier Message */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10 mb-3">
        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-xs text-gray-300 leading-tight">{getProgressMessage()}</p>
      </div>

      {/* Discount Tiers Table */}
      <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
        <h4 className="text-[10px] sm:text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
          <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          <span className="truncate">
            {language === 'tr' && 'İndirim Seviyeleri'}
            {language === 'en' && 'Discount Tiers'}
            {language === 'ru' && 'Уровни Скидок'}
          </span>
        </h4>
        <div className="space-y-1">
          {sortedTiers.map((tier) => {
            const isAchieved = currentGb >= tier.minGb;
            const isCurrentTier = currentDiscount === tier.discountPercent;
            return (
              <div 
                key={tier.minGb}
                className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg text-[10px] sm:text-xs transition-all ${
                  isCurrentTier 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40' 
                    : isAchieved 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white/[0.02] border border-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${isAchieved ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className={`whitespace-nowrap ${isAchieved ? 'text-white' : 'text-gray-500'}`}>
                    {tier.minGb}+ GB
                  </span>
                </div>
                <div className={`font-bold whitespace-nowrap ${isCurrentTier ? 'text-green-400' : isAchieved ? 'text-cyan-400' : 'text-gray-500'}`}>
                  %{tier.discountPercent}
                  {isCurrentTier && ' ✓'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-[9px] sm:text-[10px] text-gray-500 text-center">
        {language === 'tr' && '* İndirimler her ayın 1\'inde sıfırlanır'}
        {language === 'en' && '* Discounts reset on the 1st of each month'}
        {language === 'ru' && '* Скидки сбрасываются 1-го числа каждого месяца'}
      </div>
    </div>
  );
}
