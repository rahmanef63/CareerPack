"use client";

import { useQuery } from "convex/react";
import { Gauge } from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";

/**
 * Daily AI quota indicator. Reads `ai:day` bucket from rateLimitEvents
 * via `api.ai.queries.getMyQuota` (reactive — refreshes after each
 * action automatically).
 *
 * Visual states:
 *   - default: brand-muted background, "X/100"
 *   - warn   : amber when > 75% used
 *   - danger : destructive when ≥ 95% used or fully exhausted
 *   - hidden : when query returns null (unauthenticated, SSR)
 */
export function QuotaChip() {
  const quota = useQuery(api.ai.queries.getMyQuota, {});
  if (!quota) return null;
  const { used, max } = quota.day;
  const ratio = used / max;
  const tone =
    ratio >= 0.95 ? "danger" : ratio >= 0.75 ? "warn" : "default";

  return (
    <Badge
      variant={tone === "danger" ? "destructive" : "secondary"}
      className={
        "text-[10px] gap-1 " +
        (tone === "warn"
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          : "")
      }
      title={`Kuota AI harian: ${used} / ${max}. Reset 24 jam dari penggunaan pertama.`}
    >
      <Gauge className="w-3 h-3" />
      {used}/{max}
    </Badge>
  );
}
