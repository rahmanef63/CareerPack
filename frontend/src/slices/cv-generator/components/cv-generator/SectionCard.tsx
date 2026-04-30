"use client";

import { useCallback } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function SectionCard({ title, icon: Icon, children, isOpen, onToggle, onAdd, addLabel }: SectionCardProps) {
  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }
    onToggle();
  }, [onToggle]);

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader
        className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-brand" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="text-brand hover:text-brand hover:bg-brand-muted"
              >
                <Plus className="w-4 h-4 mr-1" />
                {addLabel}
              </Button>
            )}
            {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {isOpen && <CardContent className="pt-6">{children}</CardContent>}
    </Card>
  );
}
