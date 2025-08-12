import type { IStorage } from "../storage";

export class CouponService {
  constructor(private storage: IStorage) {}

  async validateCoupon(code: string, shipId?: string) {
    const coupon = await this.storage.getCouponByCode(code);
    
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    if (!coupon.isActive) {
      throw new Error("Coupon is inactive");
    }

    const now = new Date();

    // Check start date
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new Error("Coupon is not yet active");
    }

    // Check end date
    if (coupon.endsAt && new Date(coupon.endsAt) < now) {
      throw new Error("Coupon has expired");
    }

    // Check usage limit
    if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
      throw new Error("Coupon usage limit reached");
    }

    // Check ship restriction
    if (coupon.shipId && shipId && coupon.shipId !== shipId) {
      throw new Error("Coupon is not valid for this ship");
    }

    return coupon;
  }

  async applyCoupon(code: string, shipId?: string) {
    const coupon = await this.validateCoupon(code, shipId);
    
    // Increment usage count
    await this.storage.updateCoupon(coupon.id, {
      uses: coupon.uses + 1
    });

    return coupon;
  }
}
