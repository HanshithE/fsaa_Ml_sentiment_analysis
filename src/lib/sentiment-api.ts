import { supabase } from "@/integrations/supabase/client";

export interface FeedbackEntry {
  id: string;
  source: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed" | null;
  confidence: number | null;
  keywords: string[] | null;
  created_at: string;
}

export interface SentimentAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
}

export async function analyzeSentiment(content: string, source = "manual") {
  const response = await supabase.functions.invoke("analyze-sentiment", {
    body: { content, source },
  });
  if (response.error) throw new Error(response.error.message);
  return response.data as FeedbackEntry;
}

export async function fetchFeedback(limit = 50): Promise<FeedbackEntry[]> {
  const { data, error } = await supabase
    .from("feedback_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as FeedbackEntry[];
}

export async function fetchAlerts(): Promise<SentimentAlert[]> {
  const { data, error } = await supabase
    .from("sentiment_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as SentimentAlert[];
}

export async function markAlertRead(id: string) {
  const { error } = await supabase
    .from("sentiment_alerts")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export function subscribeFeedback(callback: (entry: FeedbackEntry) => void) {
  return supabase
    .channel("feedback-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "feedback_entries" },
      (payload) => callback(payload.new as FeedbackEntry)
    )
    .subscribe();
}

export function subscribeAlerts(callback: (alert: SentimentAlert) => void) {
  return supabase
    .channel("alerts-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sentiment_alerts" },
      (payload) => callback(payload.new as SentimentAlert)
    )
    .subscribe();
}
