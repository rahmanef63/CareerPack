"use client";

import { AutoModePanel } from "../auto/AutoModePanel";
import type { Bind, SectionOverrides } from "../form/types";

export type AutoConfigCardProps = { bind: Bind; noCard?: boolean } &
  SectionOverrides;

/**
 * Wraps AutoModePanel and adapts its (toggles, onChange) API to the
 * unified form `bind` interface so the parent view never has to know
 * about AutoModePanel's prop shape.
 */
export function AutoConfigCard({ bind, noCard = false }: AutoConfigCardProps) {
  const autoToggles = bind("autoToggles");
  return (
    <AutoModePanel
      toggles={autoToggles.value}
      onChange={autoToggles.onChange}
      noCard={noCard}
    />
  );
}
