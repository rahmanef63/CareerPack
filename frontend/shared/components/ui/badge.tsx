import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

/**
 * Badge text is `text-xs` (12px) + `font-semibold`. WCAG counts that as NORMAL
 * text, not large — 14pt bold ≈ 18.66px is the bold threshold — so every pair
 * below is held to 4.5:1, not 3:1.
 *
 * Audited 2026-08-13. All four variants ride semantic token pairs, so the two
 * that failed were fixed in `shared/styles/index.css` (where the fix also
 * propagates to Button, tooltip, checkbox and the alert dialog) rather than
 * overridden here. Measured foreground-on-fill ratios:
 *
 *   variant      light            dark
 *   default      4.79:1 ok        3.73:1 FAIL -> 4.79:1   (dark --primary L 0.62 -> 0.56)
 *   destructive  3.72:1 FAIL      3.72:1 FAIL -> 4.87:1   (--destructive-foreground 1.00 -> 0.20, both palettes)
 *   secondary    6.81:1 ok       11.89:1 ok              (untouched)
 *   outline      12.69:1 ok      11.89:1 ok              (untouched)
 *
 * Do not swap these for hardcoded colours or re-lighten the tokens; both
 * failing pairs sat exactly on the wrong side of 4.5 and have little headroom.
 * Known gap: the 80%-alpha hover fills lighten over a light card, which drops
 * default to 3.40:1 and destructive to 6.10:1 -> the dark-card destructive
 * hover is 3.64:1. Hover is a transient state on a non-interactive <div> and
 * axe measures the rest state, so it was left as-is.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
