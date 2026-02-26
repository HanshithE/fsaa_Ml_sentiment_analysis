import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type FeedbackEntry } from "@/lib/sentiment-api";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

const sentimentColors: Record<string, string> = {
  positive: "bg-[hsl(var(--sentiment-positive))] text-white",
  negative: "bg-[hsl(var(--sentiment-negative))] text-white",
  neutral: "bg-[hsl(var(--sentiment-neutral))] text-white",
  mixed: "bg-[hsl(var(--sentiment-mixed))] text-white",
};

export function FeedbackFeed({ entries }: { entries: FeedbackEntry[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Recent Feedback
          <Badge variant="secondary" className="ml-auto font-mono text-xs">
            {entries.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-3">
            {entries.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No feedback analyzed yet. Submit some text to get started.
              </p>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border p-3 space-y-2 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-relaxed line-clamp-2">{entry.content}</p>
                  {entry.sentiment && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sentimentColors[entry.sentiment]}`}
                    >
                      {entry.sentiment}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{entry.source}</span>
                  <span>·</span>
                  {entry.confidence != null && (
                    <>
                      <span>{Math.round(entry.confidence * 100)}%</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                </div>
                {entry.keywords && entry.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-[10px] px-1.5 py-0">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
