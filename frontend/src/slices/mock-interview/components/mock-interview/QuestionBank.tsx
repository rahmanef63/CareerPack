"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { indonesianDifficultyLabels } from "@/shared/data/indonesianData";
import { categoryLabels, getDifficultyColor } from "../../constants/categories";

interface Props {
  filteredQuestions: ReadonlyArray<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
  }>;
  selectedCategory: string | null;
  setSelectedCategory: (s: string | null) => void;
  categories: string[];
  currentQuestionIndex: number;
  favorites: Set<string>;
  onSelect: (idx: number) => void;
  onToggleFavorite: (id: string) => void;
}

export function QuestionBank({
  filteredQuestions, selectedCategory, setSelectedCategory, categories,
  currentQuestionIndex, favorites, onSelect, onToggleFavorite,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? "bg-brand" : ""}
        >
          Semua Pertanyaan
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-brand" : ""}
          >
            {categoryLabels[category]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredQuestions.map((question, index) => (
          <Card
            key={question.id}
            className={cn(
              "border-border cursor-pointer hover:border-brand transition-all duration-200",
              currentQuestionIndex === index && "border-brand bg-brand-muted",
            )}
            onClick={() => onSelect(index)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {indonesianDifficultyLabels[question.difficulty]}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted">
                      {categoryLabels[question.category]}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground">
                    {question.question}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(question.id);
                  }}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      favorites.has(question.id)
                        ? "fill-amber-400 text-warning/80"
                        : "text-muted-foreground",
                    )}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
