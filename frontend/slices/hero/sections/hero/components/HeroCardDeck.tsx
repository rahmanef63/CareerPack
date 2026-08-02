"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";

import {
  AiAssistant,
  DocumentChecklist,
  MockInterview,
} from "@/shared/components/illustrations/features";
import { cn } from "@/shared/lib/utils";

/** How long a card stays at the front before the deck shuffles. */
const CYCLE_MS = 4500;

type DeckCard = {
  /**
   * Inline SVG component — never a file. An .svg (or a raster) loaded through
   * `<img>` / `next/image` is an isolated document, so the OKLCH theme tokens
   * on `:root` / `.dark` never cross into it and the art cannot follow the
   * preset. Inlining also means no srcset, no LCP request, and no crop.
   */
  Illustration: ComponentType<{ className?: string }>;
  /** Visible caption — doubles as the card's accessible name and its key. */
  label: string;
};

/**
 * All three illustrations carry the 16:9 viewBox of the shots they replace, so
 * the deck needs exactly one frame ratio and no per-card crop.
 */
const CARDS: DeckCard[] = [
  { Illustration: DocumentChecklist, label: "Ceklis Dokumen" },
  { Illustration: MockInterview, label: "Simulasi Wawancara" },
  { Illustration: AiAssistant, label: "Asisten AI" },
];

/**
 * Placement per stack depth (0 = front). Deliberately class-based, not inline
 * style: the hover/focus fan is pure CSS via `group-hover/deck:` and an inline
 * `style` transform would out-specify it.
 *
 * Two things the numbers have to respect:
 * - scale-down eats the offset. A 0.94 card is ~16px narrower per side at
 *   desktop width, so the translate has to clear that before any of the card
 *   actually peeks out.
 * - below `sm` the column is only ~290px wide, so rest offsets stay ≤ 6px and
 *   the hover fan does not run at all — a fanned card would otherwise reach
 *   past the section edge and get clipped.
 */
const DEPTH_CLASSES = [
  // Front — square to the grid, lifts when the deck is hovered or focused.
  "z-30 shadow-xl group-hover/deck:-translate-y-2 group-hover/deck:shadow-2xl group-focus-within/deck:-translate-y-2 group-focus-within/deck:shadow-2xl sm:group-hover/deck:-translate-y-3 sm:group-focus-within/deck:-translate-y-3",
  // One step back — fans out to the right.
  "z-20 translate-x-1.5 translate-y-2.5 rotate-[1.5deg] scale-[0.97] shadow-lg sm:translate-x-4 sm:translate-y-5 sm:rotate-[2deg] sm:group-hover/deck:translate-x-12 sm:group-hover/deck:rotate-[4deg] sm:group-focus-within/deck:translate-x-12 sm:group-focus-within/deck:rotate-[4deg]",
  // Deepest — fans out to the left.
  "z-10 -translate-x-1.5 translate-y-5 rotate-[-1.5deg] scale-[0.94] shadow-md sm:-translate-x-6 sm:translate-y-10 sm:rotate-[-2deg] sm:group-hover/deck:-translate-x-12 sm:group-hover/deck:translate-y-12 sm:group-hover/deck:rotate-[-4deg] sm:group-focus-within/deck:-translate-x-12 sm:group-focus-within/deck:translate-y-12 sm:group-focus-within/deck:rotate-[-4deg]",
];

// Focus uses `outline-*`, not `ring-*`: the card's resting `ring-1 ring-border`
// sits on the same property, so a focus ring there would just swap one hairline
// for another instead of reading as a focus indicator.
// `text-left` because these are <button>s: the UA centers button text, and the
// caption strip would otherwise sit centered under left-aligned artwork.
const CARD_BASE =
  "group/card absolute inset-x-0 top-0 block rounded-2xl bg-card p-2 text-left ring-1 ring-border transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/**
 * The illustrations are transparent and their base surface is `fill-card`, so
 * the well behind them must NOT be `bg-card` or the panels disappear into it.
 * A brand wash is the one tint that separates in both themes: `bg-muted`
 * collapses onto `card` in dark, `bg-background` collapses onto it in light.
 */
const CARD_WELL = "block overflow-hidden rounded-xl bg-brand/5";

/**
 * Duration + easing are inline rather than arbitrary-value utilities.
 * `tailwindcss-animate` registers its own duration/ease utilities on top of
 * core's, so Tailwind flags any arbitrary form of either as ambiguous and
 * silently emits nothing — the cards would fall back to the 150ms default.
 * Named scale values dodge that, but 450ms and this curve are not on the scale.
 *
 * The global `prefers-reduced-motion` block sets `transition-duration: .01ms
 * !important`, which still outranks an inline style, so this stays honest.
 */
const CARD_TRANSITION = {
  transitionDuration: "450ms",
  transitionTimingFunction: "cubic-bezier(0.2, 0.9, 0.25, 1)",
} as const;

interface HeroCardDeckProps {
  /**
   * Starts the anonymous demo session — same handler the "Lihat Demo" CTA
   * uses. Passed down rather than pulled from `useHeroActions()` here: a
   * second call site would mean a second `isDemoLoading` state, and the
   * double-click guard lives in that state, so two deck+CTA clicks in the
   * same tick would create two anonymous accounts.
   */
  onDemo: () => void;
  isDemoLoading: boolean;
}

/**
 * The hero's motion moment: three product illustrations stacked like a fanned
 * deck. Hover/focus spreads them apart (CSS only); an interval shuffles the
 * front card to the back every {@link CYCLE_MS} so all three get seen without
 * interaction.
 *
 * The cards are the product preview a curious visitor actually clicks, so they
 * do what the CTA beside them does — open a demo session on real screens. They
 * used to link to /login, which asked the one visitor who had shown interest to
 * fill in a form before seeing anything.
 *
 * The cycle stands down whenever it would be wasted or unwelcome — pointer or
 * keyboard on the deck, a backgrounded tab, or `prefers-reduced-motion`.
 */
export function HeroCardDeck({ onDemo, isDemoLoading }: HeroCardDeckProps) {
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  /** Sticky user choice from the pause control — survives pointer leave. */
  const [stopped, setStopped] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Both signals are subscriptions, not one-shot reads. Reduce Motion in
  // particular: the global CSS block flips transitions to instant the moment
  // the OS setting changes, so a shuffle that only sampled `matches` at mount
  // would keep swapping cards with no animation — worse than either state.
  // Reading them here (not in render) is also what keeps SSR hydration honest.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setTabHidden(document.visibilityState === "hidden");
      setReduced(mq.matches);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    mq.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    // No interval at all while paused / backgrounded — cheaper than ticking
    // and bailing, and it makes "paused" observable in one place.
    if (paused || stopped || tabHidden || reduced) return;

    const id = window.setInterval(
      () => setFront((current) => (current + 1) % CARDS.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [paused, stopped, tabHidden, reduced]);

  return (
    <div
      // pb-20 (not pb-16): the extra 16px is the clear strip the pause control
      // sits in, below where the deepest fanned card can ever reach.
      className="group/deck relative mx-auto w-full max-w-[26rem] px-5 pb-20 pt-6 sm:px-8 lg:max-w-none"
      // React's onFocus/onBlur bubble (focusin/focusout), so tabbing into any
      // card pauses the shuffle the same way hovering does.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Sizing box only — cards are absolute, so this is what gives the deck
          its height in flow. 16/10 against the card's 16/9 artwork leaves room
          for the caption strip and the frame padding; the wrapper's pb-20
          absorbs the remainder plus the deepest card's fanned drop. */}
      <div className="relative aspect-[16/10] w-full">
        {CARDS.map((card, index) => {
          const depth = (index - front + CARDS.length) % CARDS.length;

          return (
            <button
              key={card.label}
              type="button"
              onClick={onDemo}
              disabled={isDemoLoading}
              className={cn(CARD_BASE, DEPTH_CLASSES[depth])}
              style={CARD_TRANSITION}
              // Promote the focused card to the front. The fan-out is `sm:`-only,
              // so below 640px a back card — and its focus outline — sits behind
              // the opaque front card; and because the shuffle never reorders the
              // DOM, visual order would otherwise drift away from tab order.
              // Focusing the card fixes both at every breakpoint.
              onFocus={() => setFront(index)}
            >
              <span className={CARD_WELL}>
                <card.Illustration className="block" />
              </span>
              {/* Only the front card shows its caption. The deck fans, so the
                  back cards' caption strips poked out below the front one and
                  rendered as two overlapping labels with two stacked arrows —
                  it read as broken layout, not as depth. `opacity-0` rather
                  than `hidden`: this text is the button's accessible name, so
                  it has to stay in the a11y tree for the cards behind. */}
              <span
                className={cn(
                  "flex items-center justify-between gap-2 px-1.5 pb-0.5 pt-2 text-[13px] font-medium leading-none text-card-foreground transition-opacity duration-300",
                  depth === 0 ? "opacity-100" : "opacity-0",
                )}
              >
                {card.label}
                <ArrowUpRight
                  aria-hidden
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5"
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* WCAG 2.2.2 — the shuffle starts by itself and runs well past 5s, and
          hover/focus pause reaches neither a touch user nor a screen reader
          user. This is the explicit mechanism. Hidden under
          `prefers-reduced-motion`, where the cycle never starts at all. */}
      <button
        type="button"
        onClick={() => setStopped((current) => !current)}
        aria-label={stopped ? "Lanjutkan pergantian kartu" : "Jeda pergantian kartu"}
        className="absolute bottom-1 right-1 z-40 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:hidden sm:right-3"
      >
        {stopped ? (
          <Play className="h-3 w-3" aria-hidden />
        ) : (
          <Pause className="h-3 w-3" aria-hidden />
        )}
      </button>
    </div>
  );
}
