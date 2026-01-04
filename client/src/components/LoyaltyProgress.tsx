import { useQuery } from "@tanstack/react-query";
import { Gift, TrendingUp, Award, Percent } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoyaltyStatus {
  currentGb: number;
  currentDiscount: number;
  nextTier: { neededGb: number; nextDiscount: number } | null;
  daysRemaining: number;
  tiers: { minGb: number; discountPercent: number }[];
}

export function LoyaltyProgress() {
  const { language } = useLanguage();
  
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
        return `${nextTier.neededGb} GB daha alarak %${nextTier.nextDiscount} indirim kazanabilirsiniz!`;
      }
      return `Maksimum indirim seviyesine ulaştınız!`;
    } else if (language === 'ru') {
      if (nextTier) {
        return `Купите ещё ${nextTier.neededGb} GB и получите ${nextTier.nextDiscount}% скидку!`;
      }
      return `Вы достигли максимального уровня скидки!`;
    } else {
      if (nextTier) {
        return `Buy ${nextTier.neededGb} GB more to get ${nextTier.nextDiscount}% discount!`;
      }
      return `You've reached the maximum discount level!`;
    }
  };

  const getDaysRemainingText = () => {
    if (language === 'tr') {
      return `Ay sonuna ${daysRemaining} gün`;
    } else if (language === 'ru') {
      return `${daysRemaining} дней до конца месяца`;
    } else {
      return `${daysRemaining} days until month end`;
    }
  };

  const getLoyaltyTitle = () => {
    if (language === 'tr') {
      return 'Sadakat İndirimi';
    } else if (language === 'ru') {
      return 'Программа Лояльности';
    } else {
      return 'Loyalty Discount';
    }
  };

  const getCurrentDiscountText = () => {
    if (language === 'tr') {
      return 'Mevcut İndirim';
    } else if (language === 'ru') {
      return 'Ваша Скидка';
    } else {
      return 'Your Discount';
    }
  };

  const getThisMonthText = () => {
    if (language === 'tr') {
      return 'Bu ay';
    } else if (language === 'ru') {
      return 'В этом месяце';
    } else {
      return 'This month';
    }
  };

  const getDiscountTiersText = () => {
    if (language === 'tr') {
      return 'İndirim Seviyeleri';
    } else if (language === 'ru') {
      return 'Уровни Скидок';
    } else {
      return 'Discount Tiers';
    }
  };

  const getMonthlyResetText = () => {
    if (language === 'tr') {
      return 'Her ayın 1\'inde sıfırlanır';
    } else if (language === 'ru') {
      return 'Сбрасывается 1-го числа каждого месяца';
    } else {
      return 'Resets on the 1st of each month';
    }
  };

  return (
    <div className="glass-card p-3 sm:p-4 rounded-xl" data-testid="loyalty-progress"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-cyan-400">
              {getLoyaltyTitle()}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-400">
              {getDaysRemainingText()}
            </p>
          </div>
        </div>
        
        {currentDiscount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full self-start sm:self-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40">
            <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-xs sm:text-sm font-bold text-green-400">{currentDiscount}%</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between text-[10px] sm:text-xs text-gray-400 mb-2 gap-1">
        <span className="whitespace-nowrap">
          {getThisMonthText()}: <span className="text-white font-medium">{currentGb} GB</span>
        </span>
        <span className="whitespace-nowrap">
          {getCurrentDiscountText()}: <span className="text-green-400 font-medium">{currentDiscount}%</span>
        </span>
      </div>
      
      <div className="mb-3">
        <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-700/50">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 p-2 rounded-lg mb-3 bg-slate-800/50 border border-slate-700/50">
        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-xs text-gray-300 leading-tight">{getProgressMessage()}</p>
      </div>

      <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <h4 className="text-[10px] sm:text-xs font-semibold mb-2 flex items-center gap-1 text-cyan-400">
          <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          {getDiscountTiersText()}
        </h4>
        <div className="space-y-1">
          {sortedTiers.map((tier) => {
            const isAchieved = currentGb >= tier.minGb;
            const isCurrentTier = currentDiscount === tier.discountPercent;
            return (
              <div 
                key={tier.minGb}
                className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg text-[10px] sm:text-xs transition-all`}
                style={{
                  background: isCurrentTier 
                    ? 'rgba(34, 197, 94, 0.15)'
                    : isAchieved 
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrentTier 
                    ? '1px solid rgba(34, 197, 94, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className={`whitespace-nowrap ${isAchieved ? 'text-white' : 'text-gray-500'}`}>
                  {tier.minGb}+ GB
                </span>
                <div className={`font-bold whitespace-nowrap flex items-center gap-1 ${
                  isCurrentTier ? 'text-green-400' : isAchieved ? 'text-cyan-400' : 'text-gray-500'
                }`}>
                  {tier.discountPercent}%
                  {isCurrentTier && <span className="text-green-400">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-[9px] sm:text-[10px] text-gray-500 text-center">
        {getMonthlyResetText()}
      </div>
    </div>
  );
}
