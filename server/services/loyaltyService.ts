import { storage } from "../storage";
import { log } from "../vite";

interface LoyaltyTier {
  minGb: number;
  discountPercent: number;
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  { minGb: 100, discountPercent: 15 },
  { minGb: 50, discountPercent: 10 },
  { minGb: 25, discountPercent: 5 },
  { minGb: 0, discountPercent: 0 },
];

export class LoyaltyService {
  static calculateDiscountTier(totalGb: number): number {
    for (const tier of LOYALTY_TIERS) {
      if (totalGb >= tier.minGb) {
        return tier.discountPercent;
      }
    }
    return 0;
  }

  static getNextTierInfo(currentGb: number): { neededGb: number; nextDiscount: number } | null {
    const sortedTiers = [...LOYALTY_TIERS].sort((a, b) => a.minGb - b.minGb);
    
    for (const tier of sortedTiers) {
      if (currentGb < tier.minGb) {
        return {
          neededGb: tier.minGb - currentGb,
          nextDiscount: tier.discountPercent
        };
      }
    }
    return null;
  }

  static isNewMonth(loyaltyMonthStart: Date | null): boolean {
    if (!loyaltyMonthStart) return true;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startMonth = loyaltyMonthStart.getMonth();
    const startYear = loyaltyMonthStart.getFullYear();
    
    return currentMonth !== startMonth || currentYear !== startYear;
  }

  static getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  static getDaysRemainingInMonth(): number {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  }

  static async updateUserLoyalty(userId: string, purchasedGb: number): Promise<{
    newTotalGb: number;
    newDiscount: number;
    previousDiscount: number;
    tierChanged: boolean;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let currentMonthGb = user.monthly_data_gb || 0;
    let loyaltyMonthStart = user.loyalty_month_start;
    const previousDiscount = user.loyalty_discount_percent || 0;

    if (this.isNewMonth(loyaltyMonthStart)) {
      currentMonthGb = 0;
      loyaltyMonthStart = this.getMonthStart();
      log(`Loyalty reset for user ${userId} - new month started`);
    }

    const newTotalGb = currentMonthGb + purchasedGb;
    const newDiscount = this.calculateDiscountTier(newTotalGb);

    await storage.updateUserLoyalty(userId, {
      monthly_data_gb: newTotalGb,
      loyalty_discount_percent: newDiscount,
      loyalty_month_start: loyaltyMonthStart,
    });

    log(`Loyalty updated for user ${userId}: ${newTotalGb}GB, ${newDiscount}% discount`);

    return {
      newTotalGb,
      newDiscount,
      previousDiscount,
      tierChanged: newDiscount !== previousDiscount,
    };
  }

  static async getUserLoyaltyStatus(userId: string): Promise<{
    currentGb: number;
    currentDiscount: number;
    nextTier: { neededGb: number; nextDiscount: number } | null;
    daysRemaining: number;
    tiers: typeof LOYALTY_TIERS;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let currentGb = user.monthly_data_gb || 0;
    let currentDiscount = user.loyalty_discount_percent || 0;

    if (this.isNewMonth(user.loyalty_month_start)) {
      currentGb = 0;
      currentDiscount = 0;
    }

    return {
      currentGb,
      currentDiscount,
      nextTier: this.getNextTierInfo(currentGb),
      daysRemaining: this.getDaysRemainingInMonth(),
      tiers: LOYALTY_TIERS,
    };
  }

  static async resetAllUsersMonthlyLoyalty(): Promise<number> {
    const count = await storage.resetAllMonthlyLoyalty();
    log(`Monthly loyalty reset completed for ${count} users`);
    return count;
  }

  static applyLoyaltyDiscount(amount: number, discountPercent: number): {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    discountPercent: number;
  } {
    const discountAmount = (amount * discountPercent) / 100;
    const finalAmount = amount - discountAmount;
    
    return {
      originalAmount: amount,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      discountPercent,
    };
  }
}

export const loyaltyService = new LoyaltyService();
