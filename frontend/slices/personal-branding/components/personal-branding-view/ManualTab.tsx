"use client";

import {
  Blocks, Layers, Palette, Settings as SettingsIcon,
} from "lucide-react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/shared/components/ui/tabs";
import { PreviewSplitLayout } from "@/shared/components/layout/PreviewSplitLayout";
import { ModeWarning } from "../../sections/ModeWarning";
import { ManualDesignCard } from "../../sections/ManualDesignCard";
import { ManualBlocksCard } from "../../sections/ManualBlocksCard";
import { BlockPresetsCard } from "../../builder/BlockPresetsCard";
import { IdentityCard } from "../../sections/IdentityCard";
import { HeroTogglesCard } from "../../sections/HeroTogglesCard";
import { ContactCard } from "../../sections/ContactCard";
import { IndexingCard } from "../../sections/IndexingCard";
import { SaveActions } from "../../sections/SaveActions";
import { MiniPreviewFrame } from "../MiniPreviewFrame";
import type { usePBForm } from "../../form/usePBForm";

interface Props {
  form: ReturnType<typeof usePBForm>;
}

export function ManualTab({ form }: Props) {
  return (
    <TabsContent value="custom" className="mt-4 space-y-4">
      <ModeWarning />
      <PreviewSplitLayout
        preview={
          <MiniPreviewFrame
            state={form.state}
            slugTrimmed={form.slugTrimmed}
          />
        }
      >
        <Tabs defaultValue="presets">
          <TabsList variant="pills">
            <TabsTrigger value="presets" className="gap-1.5">
              <Blocks className="h-4 w-4" />
              <span>Preset</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5">
              <Layers className="h-4 w-4" />
              <span>Konten</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-1.5">
              <Palette className="h-4 w-4" />
              <span>Tampilan</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <SettingsIcon className="h-4 w-4" />
              <span>Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-4 space-y-4">
            <BlockPresetsCard bind={form.bind} />
            <SaveActions
              saving={form.saving}
              canEnable={form.canEnable}
              submit={form.submit}
              lastSavedAt={form.lastSavedAt}
              autoSavePending={form.autoSavePending}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-4 space-y-4">
            <ManualBlocksCard bind={form.bind} />
            <SaveActions
              saving={form.saving}
              canEnable={form.canEnable}
              submit={form.submit}
              lastSavedAt={form.lastSavedAt}
              autoSavePending={form.autoSavePending}
            />
          </TabsContent>

          <TabsContent value="design" className="mt-4 space-y-4">
            <ManualDesignCard bind={form.bind} />
            <SaveActions
              saving={form.saving}
              canEnable={form.canEnable}
              submit={form.submit}
              lastSavedAt={form.lastSavedAt}
              autoSavePending={form.autoSavePending}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <IdentityCard
              bind={form.bind}
              validation={form.slugValidation}
              slugTrimmed={form.slugTrimmed}
              canEnable={form.canEnable}
            />
            <HeroTogglesCard bind={form.bind} />
            <ContactCard bind={form.bind} />
            <IndexingCard bind={form.bind} />
            <SaveActions
              saving={form.saving}
              canEnable={form.canEnable}
              submit={form.submit}
              lastSavedAt={form.lastSavedAt}
              autoSavePending={form.autoSavePending}
            />
          </TabsContent>
        </Tabs>
      </PreviewSplitLayout>
    </TabsContent>
  );
}
