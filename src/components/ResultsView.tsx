import { EvaluationResult } from "@/hooks/useAssessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, TrendingUp, Award, Lightbulb, Target, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  data: EvaluationResult;
  onGenerateRoadmap: () => void;
  loading: boolean;
}

export default function ResultsView({ data, onGenerateRoadmap, loading }: Props) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const scoreColor = data.score >= 70 ? "text-success" : data.score >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="min-h-screen gradient-surface p-4">
      <div className="max-w-2xl mx-auto pt-8 space-y-6">
        {/* Score Card */}
        <Card className="shadow-lg border-border/50 overflow-hidden">
          <div className="gradient-primary p-8 text-center">
            <Award className="w-12 h-12 text-primary-foreground/80 mx-auto mb-3" />
            <div className={cn("text-6xl font-display font-bold text-primary-foreground")}>
              {data.score}%
            </div>
            <p className="text-primary-foreground/80 mt-2">
              {data.correct} of {data.total} correct
            </p>
          </div>
          <CardContent className="p-6">
            <p className="text-foreground leading-relaxed">{data.evaluation.summary}</p>
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          {data.evaluation.strengths.length > 0 && (
            <Card className="border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-display">
                  <TrendingUp className="w-4 h-4 text-success" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {data.evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {data.evaluation.weaknesses.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-display">
                  <Target className="w-4 h-4 text-warning" /> Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {data.evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Suggestions */}
        {data.evaluation.suggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 font-display">
                <Lightbulb className="w-4 h-4 text-primary" /> Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {data.evaluation.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Question Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.results.map((r, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                >
                  {r.is_correct
                    ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  }
                  <span className="flex-1 text-sm font-medium text-foreground">{r.question}</span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedQ === i && "rotate-180")} />
                </button>
                {expandedQ === i && (
                  <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">Your answer:</span>
                      <span className={r.is_correct ? "text-success font-medium" : "text-destructive font-medium"}>{r.user_answer}</span>
                    </div>
                    {!r.is_correct && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-muted-foreground">Correct:</span>
                        <span className="text-success font-medium">{r.correct_answer}</span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">
                      <span className="font-medium text-foreground">Reasoning: </span>{r.reasoning}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Generate Roadmap */}
        <div className="text-center pb-8">
          <Button
            onClick={onGenerateRoadmap}
            disabled={loading}
            className="gradient-primary text-primary-foreground h-12 px-8 text-base font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating Roadmap...
              </span>
            ) : (
              "Generate Learning Roadmap"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
