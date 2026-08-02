"use client";

import { Settings2, Sparkles, Wrench } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { AIProviderForm } from "@/shared/components/ai-settings/AIProviderForm";
import { UserModelOverrideSection } from "./UserModelOverrideSection";
import { AISkillsPanel } from "./AISkillsPanel";
import { AIToolsPanel } from "./AIToolsPanel";

/**
 * Admin → AI. Konfigurasi is the shared provider form in `global` scope —
 * same fields, same order, same widgets as Setelan → AI, so the two surfaces
 * cannot drift apart again.
 *
 * Three explainer cards used to stack above the first input: the resolution
 * order is now the form's description, and the shared-key warning is helper
 * text under the API key field it is actually about.
 */
export function AIConfigPanel() {
  return (
    <Tabs defaultValue="config" className="w-full">
      <TabsList variant="pills">
        <TabsTrigger value="config">
          <Settings2 className="w-3.5 h-3.5" />
          Konfigurasi
        </TabsTrigger>
        <TabsTrigger value="skills">
          <Sparkles className="w-3.5 h-3.5" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="tools">
          <Wrench className="w-3.5 h-3.5" />
          Tools
        </TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="mt-4 space-y-4">
        <AIProviderForm scope="global" />
        <UserModelOverrideSection />
      </TabsContent>

      <TabsContent value="skills" className="mt-4">
        <AISkillsPanel />
      </TabsContent>

      <TabsContent value="tools" className="mt-4">
        <AIToolsPanel />
      </TabsContent>
    </Tabs>
  );
}
