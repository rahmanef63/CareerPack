import type { CSSProperties } from "react";
import type { FeatureGridItemWithIcon, ProofCardContent } from "../types/proof.types";
import { ProofCardShell } from "./ProofCardShell";

interface ProofFeatureGridCardProps {
  content: ProofCardContent;
  items: FeatureGridItemWithIcon[];
  style?: CSSProperties;
}

/** Proof card #1 — 2x2 icon grid: CV ATS / Kalender / Interview / Dokumen. */
export function ProofFeatureGridCard({ content, items, style }: ProofFeatureGridCardProps) {
  return (
    <ProofCardShell title={content.title} description={content.description} style={style}>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col items-start gap-2 rounded-xl bg-landing-paper p-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-landing-blue text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-landing-ink">{item.label}</span>
            </div>
          );
        })}
      </div>
    </ProofCardShell>
  );
}
