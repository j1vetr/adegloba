import type { IStorage } from "../storage";

export class CouponService {
  constructor(private storage: IStorage) {}

  async validateCoupon(code: string, shipId?: string, userId?: string) {
    const coupon = await this.storage.getCouponByCode(code);
    
    if (!coupon) {
      throw new Error("Kupon kodu bulunamadı");
    }

    if (!coupon.isActive) {
      throw new Error("Kupon aktif değil");
    }

    const now = new Date();

    // Check start date
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new Error("Kupon henüz aktif değil");
    }

    // Check end date
    if (coupon.endsAt && new Date(coupon.endsAt) < now) {
      throw new Error("Kupon süresi dolmuş");
    }

    // Check total usage limit using coupon_usage table
    const totalUsage = await this.storage.getCouponUsageCount(coupon.id);
    if (coupon.maxUses && totalUsage >= coupon.maxUses) {
      throw new Error("Kupon kullanım limiti dolmuş");
    }

    // Check per-user usage limit
    if (userId && coupon.maxUsesPerUser !== null) {
      const userUsage = await this.storage.getUserCouponUsage(userId, coupon.id);
      if (userUsage >= coupon.maxUsesPerUser) {
        throw new Error("Bu kuponu maksimum sayıda kullandınız");
      }
    }

    // Check ship restriction
    if (coupon.shipId && shipId && coupon.shipId !== shipId) {
      throw new Error("Kupon bu gemi için geçerli değil");
    }

    return coupon;
  }

  async applyCouponDiscount(coupon: any, subtotal: number) {
    let discount = 0;

    if (coupon.type === 'percentage') {
      discount = (subtotal * parseFloat(coupon.value)) / 100;
      if (coupon.maxDiscount && discount > parseFloat(coupon.maxDiscount)) {
        discount = parseFloat(coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discount = Math.min(parseFloat(coupon.value), subtotal);
    }

    const total = Math.max(0, subtotal - discount);
    
    return {
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      coupon
    };
  }

  async recordCouponUsage(couponId: string, userId: string, orderId: string, discountAmount: number) {
    await this.storage.createCouponUsage({
      couponId,
      userId,
      orderId,
      discountAmount: discountAmount.toFixed(2)
    });
  }
}
