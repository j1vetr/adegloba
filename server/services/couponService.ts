import type { IStorage } from "../storage";

export class CouponService {
  constructor(private storage: IStorage) {}

  async validateCoupon(code: string, shipId?: string, userId?: string, subtotal?: number) {
    // Normalize coupon code: trim and convert to uppercase
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await this.storage.getCouponByCode(normalizedCode);
    
    if (!coupon) {
      throw new Error("Kupon kodu bulunamadı");
    }

    if (!coupon.isActive) {
      throw new Error("Kupon aktif değil");
    }

    const now = new Date();

    // Check start date
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      throw new Error("Kupon henüz aktif değil");
    }

    // Check end date
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      throw new Error("Kupon süresi dolmuş");
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && subtotal && subtotal < coupon.minOrderAmount) {
      throw new Error(`Minimum sipariş tutarı $${coupon.minOrderAmount.toFixed(2)} olmalıdır`);
    }

    // Check total usage limit
    const totalUsage = await this.storage.getCouponUsageCount(coupon.id);
    if (coupon.maxUses && totalUsage >= coupon.maxUses) {
      throw new Error("Kupon kullanım limiti dolmuş");
    }

    // Check per-user usage limit - only count completed orders
    if (userId) {
      const userUsage = await this.storage.getUserCouponUsageForCompletedOrders(userId, coupon.id);
      if (userUsage > 0) {
        throw new Error("Bu kuponu daha önce kullandınız");
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

    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discount = coupon.discountValue;
    }

    // Cap discount to not exceed subtotal
    discount = Math.min(discount, subtotal);
    
    // Ensure minimum 0 discount
    discount = Math.max(0, discount);
    
    const total = Math.max(0, subtotal - discount);
    
    return {
      discount_amount: parseFloat(discount.toFixed(2)),
      new_total: parseFloat(total.toFixed(2)),
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

  async validateAndCalculateDiscount(code: string, subtotal: number, shipId?: string, userId?: string) {
    const coupon = await this.validateCoupon(code, shipId, userId, subtotal);
    const result = await this.applyCouponDiscount(coupon, subtotal);
    
    return {
      valid: true,
      coupon,
      discount_amount: result.discount_amount,
      new_total: result.new_total,
      savings: `$${result.discount_amount.toFixed(2)}`
    };
  }
}
