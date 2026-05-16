"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { notify } from "@/shared/lib/notify";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import type { LibraryFile } from "../../types/file";

interface Props {
  file: LibraryFile | null;
  onClose: () => void;
  onSave: (
    id: Id<"files">,
    data: { tags?: string[]; note?: string; fileName?: string },
  ) => Promise<void>;
}

export function EditMetadataDialog({ file, onClose, onSave }: Props) {
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Reset state when a different file is being edited.
  useMemo(() => {
    if (file) {
      setFileName(file.fileName);
      setNote(file.note ?? "");
      setTags(file.tags ?? []);
      setTagDraft("");
    }
  }, [file]);

  if (!file) return null;

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft("");
  };

  return (
    <ResponsiveDialog open={!!file} onOpenChange={(o) => { if (!o) onClose(); }}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit metadata</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Tag dan catatan membantu kamu menemukan media saat library bertumbuh.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nama file</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              rows={2}
              value={note}
              placeholder="Konteks singkat — contoh: 'Hero untuk landing page Acme'"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tekan Enter"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Tambah
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Hapus ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave(file._id, { tags, note, fileName });
              } catch (err) {
                notify.fromError(err, "Gagal menyimpan");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
