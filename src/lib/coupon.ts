export const COUPON_CODE = "MARDECONCHAS";
export const COUPON_DISCOUNT = 0.1;

/** Set by DiscountPopup once the customer finishes the signup form — this "activates" the coupon. */
export const DISCOUNT_POPUP_STORAGE_KEY = "shellsea_discount_popup";
const COUPON_USED_STORAGE_KEY = "shellsea_first_purchase_coupon_used";

/**
 * Normalizes a coupon code for comparison: strips whitespace, strips accents,
 * and uppercases — so "mar de conchas", "MAR DE CONCHAS", "mardeconchas" and
 * "MarDeConchas" all resolve to the same code. Used identically on the client
 * (CartDrawer) and the server (checkout.server.ts) so they never disagree.
 */
export function normalizeCouponCode(code: string): string {
  return code
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function isCouponCodeValid(code: string): boolean {
  return normalizeCouponCode(code) === COUPON_CODE;
}

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
