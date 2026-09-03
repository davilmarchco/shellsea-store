export const COUPON_CODE = "MARDECONCHAS";
export const COUPON_DISCOUNT = 0.1;

/** Set by DiscountPopup once the customer finishes the signup form — this "activates" the coupon. */
export const DISCOUNT_POPUP_STORAGE_KEY = "shellsea_discount_popup";
const COUPON_USED_STORAGE_KEY = "shellsea_first_purchase_coupon_used";

/** The coupon only works after the customer has redeemed it via the discount popup signup. */
export function isCouponActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISCOUNT_POPUP_STORAGE_KEY) === "subscribed";
}

/** The coupon is valid on the customer's first purchase only. */
export function hasUsedFirstPurchaseCoupon(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COUPON_USED_STORAGE_KEY) === "1";
}

export function markFirstPurchaseCouponUsed(): void {
  window.localStorage.setItem(COUPON_USED_STORAGE_KEY, "1");
}
