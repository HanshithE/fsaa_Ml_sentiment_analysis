
-- Feedback entries with sentiment analysis results
CREATE TABLE public.feedback_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'manual',
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sentiment alerts
CREATE TABLE public.sentiment_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (no auth for this demo dashboard)
ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read feedback" ON public.feedback_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert feedback" ON public.feedback_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read alerts" ON public.sentiment_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert alerts" ON public.sentiment_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update alerts" ON public.sentiment_alerts FOR UPDATE USING (true);

-- Enable realtime for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sentiment_alerts;

-- Create indexes
CREATE INDEX idx_feedback_sentiment ON public.feedback_entries(sentiment);
CREATE INDEX idx_feedback_created ON public.feedback_entries(created_at DESC);
CREATE INDEX idx_alerts_unread ON public.sentiment_alerts(is_read) WHERE is_read = false;
