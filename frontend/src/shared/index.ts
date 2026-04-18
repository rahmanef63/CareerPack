/**
 * Shared slice barrel — cross-cutting hooks, components, types, and utilities
 * consumed by every domain slice. Do NOT import from any domain slice here;
 * this module must be dependency-free with respect to features.
 */

// Hooks
export { AuthProvider, useAuth } from "./hooks/useAuth";
export { AIConfigProvider, useAIConfig } from "./hooks/useAIConfig";
export { UIPrefsProvider, useUIPrefs } from "./hooks/useUIPrefs";

// Shell / container components
export { DesktopSidebar } from "./components/DesktopSidebar";
export { BottomNav } from "./components/BottomNav";
export { AIFab } from "./components/AIFab";
export { MoreDrawer } from "./components/MoreDrawer";
export { SiteHeader } from "./components/SiteHeader";
export { MarketingHeader } from "./components/MarketingHeader";
export { MarketingFooter } from "./components/MarketingFooter";
export { Logo, BrandMark } from "./components/Logo";
export { PlaceholderView } from "./components/PlaceholderView";
export { InstallChip } from "./components/InstallChip";

// Responsive containers
export { ResponsiveContainer } from "./containers/ResponsiveContainer";
export { DesktopContainer } from "./containers/DesktopContainer";
export { MobileContainer } from "./containers/MobileContainer";

// Micro-interactions
export * from "./components/MicroInteractions";

// AI action bus (shared contract)
export { publish, subscribe } from "./lib/aiActionBus";

// Types
export type * from "./types";
