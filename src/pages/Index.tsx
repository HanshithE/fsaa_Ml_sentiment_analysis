import { useState, useEffect, useCallback } from "react";
import { SentimentStats } from "@/components/SentimentStats";
import { SentimentCharts } from "@/components/SentimentCharts";
import { FeedbackInput } from "@/components/FeedbackInput";
import { FeedbackFeed } from "@/components/FeedbackFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import {
  type FeedbackEntry,
  type SentimentAlert,
  fetchFeedback,
  fetchAlerts,
  subscribeFeedback,
  subscribeAlerts,
} from "@/lib/sentiment-api";
import { Brain, Activity } from "lucide-react";

const Index = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [alerts, setAlerts] = useState<SentimentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feedbackData, alertData] = await Promise.all([fetchFeedback(), fetchAlerts()]);
        setEntries(feedbackData);
        setAlerts(alertData);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const feedbackSub = subscribeFeedback((entry) => {
      setEntries((prev) => [entry, ...prev]);
    });
    const alertSub = subscribeAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });
    return () => {
      feedbackSub.unsubscribe();
      alertSub.unsubscribe();
    };
  }, []);

  const handleAlertDismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2.5">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SentimentPulse</h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Sentiment Analysis Dashboard
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-[hsl(var(--sentiment-positive))] animate-pulse" />
              <span className="font-mono">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Brain className="h-10 w-10 text-primary animate-pulse mx-auto" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            <SentimentStats entries={entries} />
            <SentimentCharts entries={entries} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <FeedbackInput />
                <AlertsPanel alerts={alerts} onDismiss={handleAlertDismiss} />
              </div>
              <div className="lg:col-span-2">
                <FeedbackFeed entries={entries} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
