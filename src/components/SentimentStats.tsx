import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FeedbackEntry } from "@/lib/sentiment-api";
import { TrendingUp, TrendingDown, Minus, Shuffle } from "lucide-react";

interface Props {
  entries: FeedbackEntry[];
}

export function SentimentStats({ entries }: Props) {
  const total = entries.length;
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  entries.forEach((e) => {
    if (e.sentiment && e.sentiment in counts) counts[e.sentiment as keyof typeof counts]++;
  });

  const avgConfidence =
    entries.reduce((sum, e) => sum + (e.confidence || 0), 0) / (total || 1);

  const stats = [
    {
      label: "Total Analyzed",
      value: total,
      icon: Shuffle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Positive",
      value: counts.positive,
      percentage: total ? Math.round((counts.positive / total) * 100) : 0,
      icon: TrendingUp,
      color: "text-[hsl(var(--sentiment-positive))]",
      bgColor: "bg-[hsl(var(--sentiment-positive))]/10",
    },
    {
      label: "Negative",
      value: counts.negative,
      percentage: total ? Math.round((counts.negative / total) * 100) : 0,
      icon: TrendingDown,
      color: "text-[hsl(var(--sentiment-negative))]",
      bgColor: "bg-[hsl(var(--sentiment-negative))]/10",
    },
    {
      label: "Avg Confidence",
      value: `${Math.round(avgConfidence * 100)}%`,
      icon: Minus,
      color: "text-[hsl(var(--sentiment-neutral))]",
      bgColor: "bg-[hsl(var(--sentiment-neutral))]/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className={`rounded-md p-1.5 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stat.value}</div>
            {"percentage" in stat && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.percentage}% of total
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
