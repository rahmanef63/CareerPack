import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import type { FreeTierItem, ProofCardContent } from "../types/proof.types";
import { FREE_TIER_ICON } from "../config/proof.config";
import { ProofCardShell } from "./ProofCardShell";

interface ProofFreeTierCardProps {
  content: ProofCardContent;
  items: FreeTierItem[];
  style?: CSSProperties;
}

/** Proof card #4 — checklist of what the free tier actually includes. */
export function ProofFreeTierCard({ content, items, style }: ProofFreeTierCardProps) {
  const GiftIcon = FREE_TIER_ICON;

  return (
    <ProofCardShell title={content.title} description={content.description} style={style}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-landing-terra-soft text-landing-terra">
        <GiftIcon className="h-4 w-4" />
      </span>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-landing-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-landing-green" />
            {item.label}
          </li>
        ))}
      </ul>
    </ProofCardShell>
  );
}
