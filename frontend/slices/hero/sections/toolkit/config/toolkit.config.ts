import {
  Target,
  Send,
  TrendingUp,
  Milestone,
  Shield,
  RefreshCw,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  ToolkitCategoryAccent,
  ToolkitCategoryId,
} from "../types/toolkit.types";

/**
 * Presentation-only config — hue/icon per category, kept separate from the
 * Indonesian copy in constants/. Every className here uses the fixed
 * landing-* palette only.
 */
export const TOOLKIT_CATEGORY_ACCENTS: Record<
  ToolkitCategoryId,
  ToolkitCategoryAccent
> = {
  persiapan: {
    icon: Target,
    chipClassName: "bg-landing-blue",
    tipClassName: "bg-landing-blue/10 text-landing-blue",
    hoverBorderClassName: "hover:border-landing-blue",
  },
  melamar: {
    icon: Send,
    chipClassName: "bg-landing-green",
    tipClassName: "bg-landing-green/10 text-landing-green",
    hoverBorderClassName: "hover:border-landing-green",
  },
  berkembang: {
    icon: TrendingUp,
    chipClassName: "bg-landing-violet",
    tipClassName: "bg-landing-violet/10 text-landing-violet",
    hoverBorderClassName: "hover:border-landing-violet",
  },
  "karier-jangka-panjang": {
    icon: Milestone,
    chipClassName: "bg-landing-terra",
    tipClassName: "bg-landing-terra/10 text-landing-terra",
    hoverBorderClassName: "hover:border-landing-terra",
  },
};

/** Icon per trust-strip cell, keyed by `TrustStripContent.id`. */
export const TRUST_STRIP_ICONS: Record<string, LucideIcon> = {
  aman: Shield,
  terintegrasi: RefreshCw,
  fleksibel: Smartphone,
  bertumbuh: Sparkles,
};

/** Base scroll-reveal stagger step (seconds) applied to category cards. */
export const TOOLKIT_REVEAL_STEP_SECONDS = 0.1;
