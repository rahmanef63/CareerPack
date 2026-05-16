export const categoryLabels: Record<string, string> = {
  behavioral: "Perilaku",
  technical: "Teknis",
  situational: "Situasional",
  "company-specific": "Spesifik Perusahaan",
};

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "bg-success/20 text-success";
    case "medium":
      return "bg-warning/20 text-warning";
    case "hard":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-foreground";
  }
}
