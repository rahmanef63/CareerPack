import * as React from "react"

/**
 * Breakpoint "mobile + tablet". Di bawah nilai ini, AppShell pakai
 * BottomNav + sidebar off-canvas (Sheet). ≥ nilai ini, sidebar
 * persisten di kiri. Sinkron dengan kelas Tailwind `lg:` (1024px).
 */
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
