// Google AdSense configuration.
// Paste the "data-ad-slot" numbers from your AdSense dashboard here.
// While a slot is empty, that ad placement renders nothing (no layout shift, no policy risk).
export const ADSENSE_CLIENT = "ca-pub-3961349764046832";

export const AD_SLOTS = {
  landingMid: "", // between features and rank intel
  landingBottom: "", // above the footer
  studentResults: "", // student results page
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;
