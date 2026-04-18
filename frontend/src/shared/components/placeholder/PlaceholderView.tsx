"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

interface PlaceholderViewProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlaceholderView({ icon: Icon, title, description }: PlaceholderViewProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-dashed border-2 border-border bg-gradient-to-br from-brand-muted/50 to-background">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center text-brand-foreground shadow-lg">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
          <p className="text-xs text-muted-foreground italic pt-2">Segera hadir</p>
        </CardContent>
      </Card>
    </div>
  );
}
