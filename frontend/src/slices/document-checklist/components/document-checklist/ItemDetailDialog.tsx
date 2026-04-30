"use client";

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
  return (
    <Dialog open={!!selectedItem} onOpenChange={onClose}>
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
                  <Label>Tenggat Waktu (Opsional)</Label>
                  <DatePicker
                    value={selectedItem.dueDate || undefined}
                    onChange={(v) => onUpdate(selectedItem.id, { dueDate: v })}
                    placeholder="Pilih tenggat"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    placeholder="Tambahkan catatan tentang dokumen ini..."
                    value={selectedItem.notes || ""}
                    onChange={(e) => onUpdate(selectedItem.id, { notes: e.target.value })}
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
