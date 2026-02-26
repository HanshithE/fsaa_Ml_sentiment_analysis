import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { type FeedbackEntry } from "@/lib/sentiment-api";
import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "hsl(152, 60%, 45%)",
  negative: "hsl(0, 72%, 55%)",
  neutral: "hsl(220, 10%, 55%)",
  mixed: "hsl(38, 90%, 55%)",
};

const pieConfig = {
  positive: { label: "Positive", color: SENTIMENT_COLORS.positive },
  negative: { label: "Negative", color: SENTIMENT_COLORS.negative },
  neutral: { label: "Neutral", color: SENTIMENT_COLORS.neutral },
  mixed: { label: "Mixed", color: SENTIMENT_COLORS.mixed },
};

export function SentimentCharts({ entries }: { entries: FeedbackEntry[] }) {
  const pieData = useMemo(() => {
    const counts: Record<string, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    entries.forEach((e) => {
      if (e.sentiment) counts[e.sentiment]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [entries]);

  const trendData = useMemo(() => {
    const days = 7;
    const result: { date: string; positive: number; negative: number; neutral: number; mixed: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "MMM dd");
      const dayEntries = entries.filter((e) => {
        const d = startOfDay(new Date(e.created_at));
        return d.getTime() === day.getTime();
      });
      result.push({
        date: dayStr,
        positive: dayEntries.filter((e) => e.sentiment === "positive").length,
        negative: dayEntries.filter((e) => e.sentiment === "negative").length,
        neutral: dayEntries.filter((e) => e.sentiment === "neutral").length,
        mixed: dayEntries.filter((e) => e.sentiment === "mixed").length,
      });
    }
    return result;
  }, [entries]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" />
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No data yet</p>
          ) : (
            <ChartContainer config={pieConfig} className="h-[250px]">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            7-Day Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieConfig} className="h-[250px]">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} radius={[0, 0, 0, 0]} />
              <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
              <Bar dataKey="mixed" stackId="a" fill={SENTIMENT_COLORS.mixed} />
              <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
