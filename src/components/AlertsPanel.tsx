import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type SentimentAlert, markAlertRead } from "@/lib/sentiment-api";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const severityConfig = {
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-[hsl(var(--sentiment-mixed))]", bg: "bg-[hsl(var(--sentiment-mixed))]/10" },
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export function AlertsPanel({
  alerts,
  onDismiss,
}: {
  alerts: SentimentAlert[];
  onDismiss: (id: string) => void;
}) {
  const unread = alerts.filter((a) => !a.is_read);

  const handleDismiss = async (id: string) => {
    try {
      await markAlertRead(id);
      onDismiss(id);
    } catch {
      toast({ title: "Error", description: "Failed to dismiss alert", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alerts
          {unread.length > 0 && (
            <Badge variant="destructive" className="ml-auto font-mono text-xs">
              {unread.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-2">
            {alerts.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No alerts. The system will notify you of sentiment spikes.
              </p>
            )}
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 flex items-start gap-3 transition-opacity ${alert.is_read ? "opacity-50" : ""}`}
                >
                  <div className={`rounded-md p-1.5 ${config.bg} mt-0.5`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{alert.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {!alert.is_read && (
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDismiss(alert.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
