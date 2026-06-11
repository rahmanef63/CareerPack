"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Download } from "lucide-react";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { cn } from "@/shared/lib/utils";
import { indonesianCategoryLabels } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../../types";

interface Props {
  selectedItem: ChecklistItem | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ChecklistItem>) => void;
}

export function ItemDetailDialog({
  selectedItem, onClose, onToggle, onUpdate,
}: Props) {
  // `selectedItem` is a one-time snapshot from the parent that the reactive
  // query never re-syncs. Binding the inputs straight to it froze the
  // displayed value and fired a mutation per keystroke. Hold edits locally,
  // seeded when a new item opens, and flush to the server on blur/close.
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    setNotes(selectedItem?.notes ?? "");
    setDueDate(selectedItem?.dueDate || undefined);
    // Seed only when a DIFFERENT item opens. Depending on notes/dueDate
    // would re-seed on every reactive update and clobber in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  const flushNotes = () => {
    if (selectedItem && notes !== (selectedItem.notes ?? "")) {
      onUpdate(selectedItem.id, { notes });
    }
  };

  return (
    <Dialog
      open={!!selectedItem}
      onOpenChange={(open) => {
        if (!open) {
          flushNotes();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        {selectedItem && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  selectedItem.completed ? "bg-success" : "bg-brand",
                )}>
                  {selectedItem.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-brand-foreground" />
                  ) : (
                    <FileText className="w-6 h-6 text-brand-foreground" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-muted">
                  {indonesianCategoryLabels[selectedItem.subcategory]}
                </Badge>
                {selectedItem.required && (
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                    Wajib
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checklist-duedate">Tenggat Waktu (Opsional)</Label>
                  <DatePicker
                    value={dueDate}
                    onChange={(v) => {
                      setDueDate(v);
                      onUpdate(selectedItem.id, { dueDate: v });
                    }}
                    placeholder="Pilih tenggat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checklist-notes">Catatan</Label>
                  <Textarea
                    id="checklist-notes"
                    placeholder="Tambahkan catatan tentang dokumen ini..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={flushNotes}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className={cn(
                    "flex-1",
                    selectedItem.completed
                      ? "bg-muted text-foreground hover:bg-muted"
                      : "bg-success hover:bg-success",
                  )}
                  onClick={() => {
                    onToggle(selectedItem.id);
                    onClose();
                  }}
                >
                  {selectedItem.completed ? (
                    "Tandai Belum Selesai"
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tandai Selesai
                    </>
                  )}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Unduh Template
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
