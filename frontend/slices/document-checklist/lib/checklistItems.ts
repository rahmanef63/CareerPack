import { indonesianDocumentChecklist } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../types";

/** Per-document state, keyed by document id. Server rows and the demo
 *  localStorage overlay both collapse to this shape. */
export interface ChecklistOverlayEntry {
  completed?: boolean;
  notes?: string;
  expiryDate?: string;
}

/** A row out of `documentChecklists.documents`. */
export interface ServerChecklistDoc {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  required: boolean;
  completed: boolean;
  notes: string;
  expiryDate?: string;
}

const STATIC_IDS = new Set(indonesianDocumentChecklist.map((d) => d.id));

function applyOverlay(
  item: ChecklistItem,
  sv: ChecklistOverlayEntry | undefined,
): ChecklistItem {
  if (!sv) return item;
  return {
    ...item,
    completed: !!sv.completed,
    notes: sv.notes || undefined,
    dueDate: sv.expiryDate,
  };
}

function toItem(d: ServerChecklistDoc): ChecklistItem {
  return {
    id: d.id,
    title: d.name,
    description: d.description ?? "",
    // Country imports are written with the tab axis already in `category`
    // (see convex/documents/mutations.ts). Anything else is treated as an
    // overseas doc rather than dropped.
    category: d.category === "local" ? "local" : "international",
    subcategory: d.subcategory ?? d.category,
    required: d.required,
    completed: d.completed,
    notes: d.notes || undefined,
    dueDate: d.expiryDate,
  };
}

/**
 * The static Indonesian list is always rendered (it is the baseline every
 * account starts from), then every *additional* server document is appended.
 *
 * That append is the whole point: before it, `items` was the static array and
 * nothing else, so importing a country template wrote 10+ documents to Convex
 * that the UI then refused to draw — "pilih negara" looked like a no-op.
 */
export function buildChecklistItems(
  serverDocs: ReadonlyArray<ServerChecklistDoc>,
  overlay: Record<string, ChecklistOverlayEntry>,
): ChecklistItem[] {
  const base = indonesianDocumentChecklist.map((tpl) =>
    applyOverlay(tpl, overlay[tpl.id]),
  );
  const extras = serverDocs
    .filter((d) => !STATIC_IDS.has(d.id))
    .map((d) => applyOverlay(toItem(d), overlay[d.id]));
  return [...base, ...extras];
}

/** True when the account is missing any of the static baseline documents —
 *  including the accounts an older, replacing `instantiateFromTemplate` wiped. */
export function needsBaselineSeed(
  serverDocs: ReadonlyArray<ServerChecklistDoc>,
): boolean {
  const have = new Set(serverDocs.map((d) => d.id));
  return indonesianDocumentChecklist.some((t) => !have.has(t.id));
}
