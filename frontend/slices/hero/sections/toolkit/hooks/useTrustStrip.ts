import { TRUST_STRIP_CONTENT } from "../constants/trustStrip";
import { TRUST_STRIP_ICONS } from "../config/toolkit.config";
import type { TrustStripItem } from "../types/toolkit.types";

/** Merges trust-strip copy (constants/) with its icon (config/). */
export function useTrustStrip(): TrustStripItem[] {
  return TRUST_STRIP_CONTENT.map((item) => ({
    ...item,
    icon: TRUST_STRIP_ICONS[item.id] ?? TRUST_STRIP_ICONS.aman,
  }));
}
