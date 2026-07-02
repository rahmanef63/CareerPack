/**
 * Chip backgrounds too light for a white glyph to clear the SC 1.4.11 3:1
 * non-text contrast floor (bg-warning ~1.9-2.3:1, bg-success ~2.5:1 in light
 * mode). `text-warning-foreground` / `text-success-foreground` are the
 * existing dark-on-fill tokens (see shared/styles/index.css) that stay
 * readable on both across light/dark. bg-primary / bg-info clear 3:1 with
 * white, so they fall through to the default.
 */
const LOW_CONTRAST_CHIP_TEXT: Record<string, string> = {
  "bg-warning": "text-warning-foreground",
  "bg-success": "text-success-foreground",
};

/** Text color class for a glyph/icon sitting on a solid accent chip background. */
export function chipIconTextClassName(bgClassName: string): string {
  return LOW_CONTRAST_CHIP_TEXT[bgClassName] ?? "text-white";
}
