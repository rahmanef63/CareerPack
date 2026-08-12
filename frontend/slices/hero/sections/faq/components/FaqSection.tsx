import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS } from "../constants/faq.constants";

/**
 * Server Component. No "use client", no state, no effects, no scroll-reveal.
 *
 * The accordion is a native `<details>/<summary>` pair on purpose: it ships
 * open-able in the initial HTML with zero JS, is keyboard- and
 * screen-reader-accessible for free, and — unlike a `.animate-on-scroll
 * opacity-0` block — the answers are readable before hydration. An answer
 * that only exists after a client bundle lands is an answer no answer engine
 * quotes.
 *
 * The first item renders `open` so the section never looks like a wall of
 * closed rows; the rest are collapsed but still present in the markup, which
 * is what Google's FAQ guidance asks for.
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      className="border-t border-border bg-muted py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Pertanyaan yang sering ditanyakan
        </h2>
        <p className="mt-3 text-muted-foreground">
          Kalau pertanyaan Anda tidak ada di sini, jawabannya biasanya lebih
          cepat ditemukan dengan mencoba sesi demo — tidak perlu email.
        </p>

        <div className="mt-10">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="group border-b border-border py-4 first:border-t"
            >
              {/* `list-none` + the webkit marker reset removes the default
                  disclosure triangle so the chevron below is the only affordance.
                  Both are needed — Safari uses the webkit pseudo-element, every
                  other engine uses `display: list-item`. */}
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-medium text-foreground sm:text-lg">
                  {item.q}
                </h3>
                <ChevronDown
                  aria-hidden
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform [transition-duration:200ms] group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
