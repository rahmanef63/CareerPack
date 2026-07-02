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
 * Indonesian copy in constants/. Every className here uses the app's real
 * theme tokens (primary/success/info/warning) only — no invented colors.
 */
export const TOOLKIT_CATEGORY_ACCENTS: Record<
  ToolkitCategoryId,
  ToolkitCategoryAccent
> = {
  persiapan: {
    icon: Target,
    chipClassName: "bg-primary",
    tipClassName: "bg-primary/10 text-muted-foreground",
    hoverBorderClassName: "hover:border-primary",
  },
  melamar: {
    icon: Send,
    chipClassName: "bg-success",
    tipClassName: "bg-success/10 text-muted-foreground",
    hoverBorderClassName: "hover:border-success",
  },
  berkembang: {
    icon: TrendingUp,
    chipClassName: "bg-info",
    tipClassName: "bg-info/10 text-muted-foreground",
    hoverBorderClassName: "hover:border-info",
  },
  "karier-jangka-panjang": {
    icon: Milestone,
    chipClassName: "bg-warning",
    tipClassName: "bg-warning/10 text-warning-text",
    hoverBorderClassName: "hover:border-warning",
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
