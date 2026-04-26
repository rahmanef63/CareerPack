// Route wrapper re-export — AISettingsPanel itself lives at
// @/shared/components/ai-settings/AISettingsPanel so both the
// /dashboard/ai-settings route and the SettingsView embed panel
// can consume it without a cross-slice import (R1).
export { AISettingsPanel } from "@/shared/components/ai-settings/AISettingsPanel";
