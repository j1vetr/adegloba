import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Gift, TrendingUp, Snowflake, TreePine, Sparkles } from "lucide-react";
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
      <div className="relative glass-card p-4 rounded-xl animate-pulse overflow-hidden" data-testid="loyalty-loading">
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
        return `${nextTier.neededGb} GB daha al, %${nextTier.nextDiscount} yılbaşı indirimi kazan! 🎄`;
      }
      return `Maksimum yılbaşı indirimine ulaştın! 🎉🎄`;
    } else if (language === 'ru') {
      if (nextTier) {
        return `Купите ещё ${nextTier.neededGb} GB и получите ${nextTier.nextDiscount}% новогоднюю скидку! 🎄`;
      }
      return `Вы достигли максимальной новогодней скидки! 🎉🎄`;
    } else {
      if (nextTier) {
        return `Buy ${nextTier.neededGb} GB more to get ${nextTier.nextDiscount}% New Year discount! 🎄`;
      }
      return `You've reached the maximum New Year discount! 🎉🎄`;
    }
  };

  const getDaysRemainingText = () => {
    if (language === 'tr') {
      return `Kampanya süresi: ${daysRemaining} gün`;
    } else if (language === 'ru') {
      return `Дней до конца акции: ${daysRemaining}`;
    } else {
      return `Campaign ends in ${daysRemaining} days`;
    }
  };

  const getNewYearSpecialText = () => {
    if (language === 'tr') {
      return 'Yılbaşına Özel İndirim';
    } else if (language === 'ru') {
      return 'Новогодняя Скидка';
    } else {
      return "New Year's Special";
    }
  };

  const getCurrentDiscountText = () => {
    if (language === 'tr') {
      return 'Kazanılan İndirim';
    } else if (language === 'ru') {
      return 'Ваша Скидка';
    } else {
      return 'Your Discount';
    }
  };

  const getThisMonthText = () => {
    if (language === 'tr') {
      return 'Bu ay aldığın';
    } else if (language === 'ru') {
      return 'В этом месяце';
    } else {
      return 'This month';
    }
  };

  return (
    <div className="relative glass-card p-3 sm:p-4 rounded-xl overflow-hidden" data-testid="loyalty-progress"
      style={{
        background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.15) 0%, rgba(21, 128, 61, 0.15) 50%, rgba(185, 28, 28, 0.15) 100%)',
        border: '2px solid rgba(220, 38, 38, 0.3)',
        boxShadow: '0 0 30px rgba(220, 38, 38, 0.1), 0 0 60px rgba(21, 128, 61, 0.1)'
      }}>
      
      {/* Decorative Corner Elements */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
        <div className="absolute top-2 left-2 text-yellow-400 animate-pulse">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
        <div className="absolute top-2 right-2 text-red-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <Snowflake className="w-4 h-4" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none">
        <div className="absolute bottom-2 left-2 text-green-400 animate-pulse" style={{ animationDelay: '1s' }}>
          <TreePine className="w-4 h-4" />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
        <div className="absolute bottom-2 right-2 text-yellow-400 animate-pulse" style={{ animationDelay: '1.5s' }}>
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Festive Border Lights Animation */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 opacity-60" 
          style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 opacity-60"
          style={{ animation: 'shimmer 3s ease-in-out infinite', animationDelay: '1.5s' }} />
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative p-1.5 sm:p-2 rounded-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(21, 128, 61, 0.3) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.4)'
            }}>
            <TreePine className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold bg-gradient-to-r from-red-400 via-yellow-300 to-green-400 bg-clip-text text-transparent">
              🎄 {getNewYearSpecialText()} 🎅
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
              <Snowflake className="w-2.5 h-2.5" />
              {getDaysRemainingText()}
            </p>
          </div>
        </div>
        
        {currentDiscount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full self-start sm:self-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              animation: 'glow 2s ease-in-out infinite'
            }}>
            <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-xs sm:text-sm font-bold text-green-400">%{currentDiscount}</span>
            <span className="text-[10px] text-green-300">🎁</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap justify-between text-[10px] sm:text-xs text-gray-400 mb-2 gap-1 relative z-10">
        <span className="whitespace-nowrap flex items-center gap-1">
          <span className="text-red-400">❄️</span>
          {getThisMonthText()}: <span className="text-white font-medium">{currentGb} GB</span>
        </span>
        <span className="whitespace-nowrap flex items-center gap-1">
          <span className="text-green-400">🎁</span>
          {getCurrentDiscountText()}: <span className="text-green-400 font-medium">%{currentDiscount}</span>
        </span>
      </div>
      
      {/* Progress Bar with festive styling */}
      <div className="mb-3 relative z-10">
        <div className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 25%, #22c55e 50%, #f59e0b 75%, #dc2626 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />
          {/* Progress ornaments */}
          {progressPercent > 10 && (
            <div className="absolute top-1/2 -translate-y-1/2 text-[8px]" style={{ left: `${Math.min(progressPercent - 5, 90)}%` }}>
              🎄
            </div>
          )}
        </div>
      </div>

      {/* Next Tier Message */}
      <div className="flex items-start gap-2 p-2 rounded-lg mb-3 relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-xs text-gray-300 leading-tight">{getProgressMessage()}</p>
      </div>

      {/* Discount Tiers Table with festive theme */}
      <div className="p-2 sm:p-3 rounded-lg relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
        <h4 className="text-[10px] sm:text-xs font-semibold mb-2 flex items-center gap-1">
          <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 flex-shrink-0" />
          <span className="bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">
            {language === 'tr' && '🎁 Yılbaşı İndirim Seviyeleri'}
            {language === 'en' && "🎁 New Year's Discount Tiers"}
            {language === 'ru' && '🎁 Уровни Новогодних Скидок'}
          </span>
        </h4>
        <div className="space-y-1">
          {sortedTiers.map((tier, index) => {
            const isAchieved = currentGb >= tier.minGb;
            const isCurrentTier = currentDiscount === tier.discountPercent;
            const tierEmoji = index === 0 ? '🎄' : index === 1 ? '⭐' : '🎅';
            return (
              <div 
                key={tier.minGb}
                className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg text-[10px] sm:text-xs transition-all`}
                style={{
                  background: isCurrentTier 
                    ? 'linear-gradient(135deg, rgba(21, 128, 61, 0.3) 0%, rgba(34, 197, 94, 0.2) 100%)'
                    : isAchieved 
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrentTier 
                    ? '1px solid rgba(34, 197, 94, 0.5)' 
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{tierEmoji}</span>
                  <span className={`whitespace-nowrap ${isAchieved ? 'text-white' : 'text-gray-500'}`}>
                    {tier.minGb}+ GB
                  </span>
                </div>
                <div className={`font-bold whitespace-nowrap flex items-center gap-1 ${
                  isCurrentTier ? 'text-green-400' : isAchieved ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  %{tier.discountPercent}
                  {isCurrentTier && <span className="text-green-400">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-[9px] sm:text-[10px] text-gray-500 text-center relative z-10 flex items-center justify-center gap-1">
        <Snowflake className="w-2.5 h-2.5 text-blue-300" />
        {language === 'tr' && 'Kampanya her ayın 1\'inde yenilenir'}
        {language === 'en' && 'Campaign renews on the 1st of each month'}
        {language === 'ru' && 'Акция обновляется 1-го числа каждого месяца'}
        <Snowflake className="w-2.5 h-2.5 text-blue-300" />
      </div>
    </div>
  );
}
