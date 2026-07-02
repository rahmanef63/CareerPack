"use client";

import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";
import { cn } from "@/shared/lib/utils";
import {
  ATS_MECHANISM_POINTS,
  FREE_TIER_ITEMS,
  PROOF_EYEBROW,
  PROOF_HEADING,
  PROOF_LEAD,
} from "../constants/proof.constants";
import { PROOF_LAYOUT } from "../config/proof.config";
import { useProofContent } from "../hooks/useProofContent";
import { ProofAtsScoreCard } from "./ProofAtsScoreCard";
import { ProofFeatureGridCard } from "./ProofFeatureGridCard";
import { ProofFreeTierCard } from "./ProofFreeTierCard";
import { ProofHighlightCard } from "./ProofHighlightCard";
import { ProofSupportChatCard } from "./ProofSupportChatCard";

/** Landing "Proof" section — replaces the old StatsSection. Left column is
 * framing copy + an honest highlight card; right column is 4 factual /
 * illustrative proof cards. See HONESTY RULE: no fabricated testimonial,
 * rating, usage count, or outcome percentage anywhere in this section. */
export function ProofSection() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const { highlightFeatures, featureGridItems, supportChatBubbles, cardsById } = useProofContent();

  return (
    <section ref={sectionRef} className="relative border-t border-landing-line bg-landing-paper-2 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn("grid grid-cols-1 gap-4", PROOF_LAYOUT.gridColsClassName)}>
          <div className="flex flex-col gap-8 lg:row-span-2">
            <div className="animate-on-scroll flex flex-col gap-4 opacity-0">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-landing-line bg-landing-paper-2 px-3 py-1 text-xs font-medium uppercase tracking-wide text-landing-muted">
                {PROOF_EYEBROW}
              </span>
              <h2 className="font-display text-3xl font-semibold leading-tight text-landing-ink sm:text-4xl">
                {PROOF_HEADING}
              </h2>
              <p className="text-base text-landing-muted">{PROOF_LEAD}</p>
            </div>

            <ProofHighlightCard features={highlightFeatures} />
          </div>

          <div className={cn("grid grid-cols-1 gap-4 lg:contents", PROOF_LAYOUT.cardsGridColsClassName)}>
            <ProofFeatureGridCard
              content={cardsById.bundle}
              items={featureGridItems}
              style={{ animationDelay: "0.1s" }}
            />
            <ProofAtsScoreCard
              content={cardsById.ats}
              points={ATS_MECHANISM_POINTS}
              style={{ animationDelay: "0.2s" }}
            />
            <ProofSupportChatCard
              content={cardsById.support}
              bubbles={supportChatBubbles}
              style={{ animationDelay: "0.3s" }}
            />
            <ProofFreeTierCard
              content={cardsById.free}
              items={FREE_TIER_ITEMS}
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
