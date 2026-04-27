"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CVTab } from "./tabs/CVTab";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { ApplicationsTab } from "./tabs/ApplicationsTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { BatchesTab } from "./tabs/BatchesTab";

/**
 * Database hub — admin-style view of every per-user table with
 * search, filter, sort, multi-select, bulk delete, JSON export, and
 * JSON import (via the existing Quick Fill pipeline). Each tab owns
 * its column set + its query/mutation hooks; the shared
 * `<ResourceTable>` handles selection + import/export plumbing.
 */
export function DatabaseView() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Database</h1>
        <p className="text-sm text-muted-foreground">
          Kelola seluruh data Anda di satu tempat. Cari, filter, sortir,
          ekspor, atau impor JSON per tabel.
        </p>
      </header>

      <Tabs defaultValue="cv" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="cv">CV</TabsTrigger>
          <TabsTrigger value="portfolio">Portofolio</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="applications">Lamaran</TabsTrigger>
          <TabsTrigger value="contacts">Kontak</TabsTrigger>
          <TabsTrigger value="batches">Riwayat Impor</TabsTrigger>
        </TabsList>
        <TabsContent value="cv"><CVTab /></TabsContent>
        <TabsContent value="portfolio"><PortfolioTab /></TabsContent>
        <TabsContent value="goals"><GoalsTab /></TabsContent>
        <TabsContent value="applications"><ApplicationsTab /></TabsContent>
        <TabsContent value="contacts"><ContactsTab /></TabsContent>
        <TabsContent value="batches"><BatchesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
