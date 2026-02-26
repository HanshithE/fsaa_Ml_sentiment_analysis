import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeSentiment } from "@/lib/sentiment-api";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

export function FeedbackInput() {
  const [content, setContent] = useState("");
  const [source, setSource] = useState("manual");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeSentiment(content.trim(), source);
      toast({
        title: "Analysis Complete",
        description: `Sentiment: ${result.sentiment} (${Math.round((result.confidence || 0) * 100)}% confidence)`,
      });
      setContent("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Analyze Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste customer feedback, review, or social media post here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="flex gap-3">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
              <SelectItem value="review">Review Site</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="survey">Survey</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
