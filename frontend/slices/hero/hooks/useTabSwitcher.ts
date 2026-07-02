"use client";

import { useState } from "react";

/** Small local-state switcher shared by any landing section that reveals one
 * item at a time behind a row of tabs/pills (Scenarios personas, Toolkit
 * categories) instead of showing every item's full detail at once. */
export function useTabSwitcher<T>(items: T[], initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  return {
    activeIndex,
    activeItem: items[activeIndex],
    setActiveIndex,
  };
}
