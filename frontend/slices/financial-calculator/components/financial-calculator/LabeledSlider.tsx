"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { Slider } from "@/shared/components/ui/slider";

type SliderProps = ComponentProps<typeof Slider>;

export interface LabeledSliderProps
  extends Omit<SliderProps, "aria-label" | "aria-labelledby"> {
  /** Accessible name announced for the thumb (`role="slider"`). */
  label: string;
  /**
   * Human-readable value, e.g. "Rp 15.000.000 / bulan". Without it a
   * screen reader reads the raw `aria-valuenow` ("15000000").
   */
  valueText: string;
  /** Class for the wrapper element (the slider itself keeps `w-full`). */
  wrapperClassName?: string;
}

/**
 * Slider with a real accessible name + formatted value announcement.
 *
 * Radix puts `role="slider"` on the **thumb**, and reads `aria-label`
 * from the thumb's own props — a single-thumb slider gets no name at
 * all (Radix only auto-labels 2+ thumbs with "Minimum"/"Maximum").
 * The shared shadcn `Slider` renders its thumbs internally and exposes
 * no per-thumb prop, so the name/valuetext are applied to the thumb
 * node after mount. React never owns those two attributes here (they
 * stay `undefined` in the thumb's props on every render), so it does
 * not strip them on re-render.
 *
 * If `shared/components/ui/slider.tsx` ever forwards thumb props, this
 * wrapper collapses into passing them straight through.
 */
export function LabeledSlider({
  label,
  valueText,
  wrapperClassName,
  ...sliderProps
}: LabeledSliderProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thumbs = hostRef.current?.querySelectorAll<HTMLElement>('[role="slider"]');
    if (!thumbs) return;
    thumbs.forEach((thumb) => {
      thumb.setAttribute("aria-label", label);
      thumb.setAttribute("aria-valuetext", valueText);
    });
  }, [label, valueText]);

  return (
    <div ref={hostRef} className={wrapperClassName}>
      <Slider {...sliderProps} />
    </div>
  );
}
