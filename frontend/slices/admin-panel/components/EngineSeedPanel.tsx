"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Database, Loader2, RefreshCw, Sparkles, Network, FileStack } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { notify } from "@/shared/lib/notify";

interface SeedRunResult {
  inserted?: number;
  updated?: number;
  skipped?: number;
  nodesInserted?: number;
  nodesUpdated?: number;
  edgesInserted?: number;
  edgesUpdated?: number;
}

/**
 * Admin panel — Engine Seed.
 *
 * One-click bootstrap for the proprietary engine catalogs:
 *   - Career Graph (29 nodes + 36 edges, ID tech labor market)
 *   - Document Templates (9 countries: ID, JP, KR, SG, AU, DE, NL, AE, SA)
 *
 * Both mutations are idempotent — patches on content drift, inserts
 * only missing rows. Safe to click repeatedly after seed-file edits.
 */
export function EngineSeedPanel() {
  const stats = useQuery(api.admin.mutations.adminGetSeedStats, {});
  const seedGraph = useMutation(api.engine.graph.mutations.seedDefaults);
  const seedDocs = useMutation(api.admin.mutations.adminSeedDocumentTemplates);

  const [graphRunning, setGraphRunning] = useState(false);
  const [docsRunning, setDocsRunning] = useState(false);
  const [graphResult, setGraphResult] = useState<SeedRunResult | null>(null);
  const [docsResult, setDocsResult] = useState<SeedRunResult | null>(null);

  const handleSeedGraph = async () => {
    setGraphRunning(true);
    try {
      const res = await seedGraph();
      setGraphResult(res);
      notify.success(
        `Career Graph: ${res.nodesInserted} node baru / ${res.nodesUpdated} update · ${res.edgesInserted} edge baru / ${res.edgesUpdated} update`,
      );
    } catch (err) {
      notify.fromError(err, "Gagal seed Career Graph");
    } finally {
      setGraphRunning(false);
    }
  };

  const handleSeedDocs = async () => {
    setDocsRunning(true);
    try {
      const res = await seedDocs({});
      setDocsResult(res);
      notify.success(
        `Document Templates: ${res.inserted} negara baru · ${res.updated} update · ${res.skipped} skip`,
      );
    } catch (err) {
      notify.fromError(err, "Gagal seed Document Templates");
    } finally {
      setDocsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-brand" />
            Engine Seed
          </CardTitle>
          <CardDescription>
            Bootstrap (atau refresh) data catalog yang dibutuhkan engine
            CareerPack. Idempotent — aman di-klik ulang setelah edit
            seed file di repo.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats — current population */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Status saat ini</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                label="Career nodes"
                value={stats.careerNodeCount}
                expected={stats.expected.careerNodes}
              />
              <StatTile label="Career edges" value={stats.careerEdgeCount} />
              <StatTile
                label="Doc templates"
                value={stats.documentTemplateCount}
                expected={stats.expected.documentTemplates}
              />
              <StatTile
                label="Roadmap templates"
                value={stats.roadmapTemplateCount}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Career Graph */}
        <SeedCard
          icon={Network}
          title="Career Graph (Phase 2)"
          description="29 node + 36 edge ID tech labor market. Dipakai oleh Career Time Machine di Skill Roadmap."
          buttonLabel="Seed Career Graph"
          running={graphRunning}
          onClick={handleSeedGraph}
          result={
            graphResult
              ? `Insert: ${graphResult.nodesInserted} node + ${graphResult.edgesInserted} edge · Update: ${graphResult.nodesUpdated} node + ${graphResult.edgesUpdated} edge`
              : null
          }
        />

        {/* Document Templates */}
        <SeedCard
          icon={FileStack}
          title="Document Templates (per negara)"
          description="Master list dokumen migrasi/kerja untuk 9 negara (ID, JP, KR, SG, AU, DE, NL, AE, SA). Dipakai untuk pre-populate checklist user."
          buttonLabel="Seed Document Templates"
          running={docsRunning}
          onClick={handleSeedDocs}
          result={
            docsResult
              ? `Insert: ${docsResult.inserted ?? 0} negara · Update: ${docsResult.updated ?? 0} · Skip: ${docsResult.skipped ?? 0}`
              : null
          }
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Catatan operasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            <strong>Idempoten</strong> — re-run aman. Patch hanya kalau
            content seed berubah; baris baru saja yang di-insert.
          </p>
          <p>
            <strong>Edit seed</strong> ada di repo:{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              convex/_seeds/careerGraph/tech.ts
            </code>{" "}
            +{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              convex/_seeds/documents/&lt;country&gt;.ts
            </code>
            . Setelah edit + deploy, klik tombol di atas untuk apply.
          </p>
          <p>
            <strong>Hard-delete</strong> tidak dilakukan oleh seed. Kalau
            seed di-remove dari repo, baris di DB tetap ada — clear
            manual lewat Convex dashboard atau tambah migration mutation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  expected?: number;
}

function StatTile({ label, value, expected }: StatTileProps) {
  const isComplete = expected !== undefined && value >= expected;
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums">
        {value}
        {expected !== undefined && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            / {expected}
          </span>
        )}
      </div>
      {expected !== undefined && (
        <Badge
          variant="outline"
          className={
            isComplete
              ? "mt-1 border-emerald-300/50 text-[10px] text-emerald-700 dark:text-emerald-400"
              : "mt-1 border-amber-300/50 text-[10px] text-amber-700 dark:text-amber-400"
          }
        >
          {isComplete ? "Lengkap" : "Belum lengkap"}
        </Badge>
      )}
    </div>
  );
}

interface SeedCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  running: boolean;
  onClick: () => void;
  result: string | null;
}

function SeedCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  running,
  onClick,
  result,
}: SeedCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-brand" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          type="button"
          onClick={onClick}
          disabled={running}
          className="w-full gap-2"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menjalankan…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {buttonLabel}
            </>
          )}
        </Button>
        {result && (
          <div className="rounded-md border border-emerald-300/50 bg-emerald-500/5 p-2 text-[11px] text-emerald-700 dark:text-emerald-400">
            ✓ {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
