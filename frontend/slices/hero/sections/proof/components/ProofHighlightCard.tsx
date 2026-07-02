import type { HighlightFeatureWithIcon } from "../types/proof.types";
import { HIGHLIGHT_HEADLINE, HIGHLIGHT_SUBTEXT } from "../constants/proof.constants";

interface ProofHighlightCardProps {
  features: HighlightFeatureWithIcon[];
}

/** Left-column highlight card. Replaces the design reference's fabricated
 * named testimonial + invented stats (+3x Interview, +85% Response Rate,
 * -70% Waktu Buat CV, "10.000+ pengguna") with an honest headline and 3
 * plain feature callouts — no invented numbers. */
export function ProofHighlightCard({ features }: ProofHighlightCardProps) {
  return (
    <div
      className="animate-on-scroll flex flex-col gap-6 rounded-2xl bg-primary p-8 text-white opacity-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-2xl font-semibold leading-tight">{HIGHLIGHT_HEADLINE}</h3>
        <p className="text-xl font-bold text-white">{HIGHLIGHT_SUBTEXT}</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/20 pt-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.id} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xl font-bold">{feature.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
