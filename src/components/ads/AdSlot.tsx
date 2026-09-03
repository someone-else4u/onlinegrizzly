import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, AD_SLOTS, type AdSlotKey } from "@/config/ads";

interface AdSlotProps {
  slot: AdSlotKey;
  className?: string;
  format?: string;
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdSlot = ({ slot, className, format = "auto", label = "Advertisement" }: AdSlotProps) => {
  const adId = AD_SLOTS[slot];
  const pushed = useRef(false);

  useEffect(() => {
    if (!adId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script blocked or not loaded yet — fail silently.
    }
  }, [adId]);

  if (!adId) return null;

  return (
    <div className={`mx-auto w-full max-w-5xl px-6 py-8 ${className ?? ""}`}>
      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
