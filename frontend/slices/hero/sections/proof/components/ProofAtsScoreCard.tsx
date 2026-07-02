import type { CSSProperties } from "react";
import type { AtsMechanismPoint, ProofCardContent } from "../types/proof.types";
import { ATS_SCORE_CAPTION, ATS_SCORE_VALUE } from "../constants/proof.constants";
import { ATS_DONUT_CONFIG } from "../config/proof.config";
import { ProofCardShell } from "./ProofCardShell";

interface ProofAtsScoreCardProps {
  content: ProofCardContent;
  points: AtsMechanismPoint[];
  style?: CSSProperties;
}

/** Proof card #2 — a conic-gradient donut showing an explicitly-labeled
 * example score, plus the mechanism (not outcome) bullets behind it. */
export function ProofAtsScoreCard({ content, points, style }: ProofAtsScoreCardProps) {
  const donutStyle: CSSProperties = {
    background: `conic-gradient(${ATS_DONUT_CONFIG.filledColor} ${ATS_SCORE_VALUE * 3.6}deg, ${ATS_DONUT_CONFIG.trackColor} 0deg)`,
  };

  return (
    <ProofCardShell title={content.title} description={content.description} style={style}>
      <div className="flex flex-col items-center gap-1.5">
        <div className={`relative flex items-center justify-center rounded-full ${ATS_DONUT_CONFIG.sizeClassName}`} style={donutStyle}>
          <div
            className="absolute flex items-center justify-center rounded-full bg-card"
            style={{ inset: `${ATS_DONUT_CONFIG.holeInsetPercent}%` }}
          >
            <span className="font-display text-xl font-semibold text-foreground">{ATS_SCORE_VALUE}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{ATS_SCORE_CAPTION}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {points.map((point) => (
          <li key={point.id} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {point.text}
          </li>
        ))}
      </ul>
    </ProofCardShell>
  );
}
