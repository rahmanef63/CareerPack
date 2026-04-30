import type { FloatingNavItem } from "./types";

/**
 * Viewport-fixed mobile bottom nav rendered OUTSIDE the iframe so its
 * `position: fixed` actually pins to the user's viewport. Clicks
 * postMessage `cp-goto` into the iframe, which echoes back the
 * target's y-offset; the parent then smooth-scrolls itself.
 */
export function FloatingMobileNav({
  items,
  onSelect,
}: {
  items: ReadonlyArray<FloatingNavItem>;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Navigasi cepat"
      className="fixed inset-x-3 bottom-3 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul
        className="grid gap-1 rounded-2xl border border-border bg-background/85 p-1.5 shadow-lg backdrop-blur"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent"
            >
              {item.iconHtml ? (
                <span
                  className="block h-5 w-5 [&_svg]:h-5 [&_svg]:w-5"
                  // Iframe-extracted SVG markup. Templates' own SVGs
                  // are static asset code — no user input — so it's
                  // safe to render. A new template MUST be reviewed
                  // before its bottom-nav SVG flows here.
                  dangerouslySetInnerHTML={{ __html: item.iconHtml }}
                />
              ) : (
                <span className="block h-5 w-5" aria-hidden />
              )}
              <span className="truncate leading-tight">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
