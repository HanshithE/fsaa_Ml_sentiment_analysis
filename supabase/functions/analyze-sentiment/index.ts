import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, source } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Call Lovable AI for sentiment analysis using tool calling for structured output
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a sentiment analysis expert. Analyze the given text and classify its sentiment. Extract key topics/keywords. Be precise and consistent.",
            },
            {
              role: "user",
              content: `Analyze the sentiment of this feedback:\n\n"${content}"`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_sentiment",
                description:
                  "Classify the sentiment of customer feedback text.",
                parameters: {
                  type: "object",
                  properties: {
                    sentiment: {
                      type: "string",
                      enum: ["positive", "negative", "neutral", "mixed"],
                      description: "The overall sentiment classification",
                    },
                    confidence: {
                      type: "number",
                      description:
                        "Confidence score between 0 and 1",
                    },
                    keywords: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Key topics or keywords extracted from the text (max 5)",
                    },
                  },
                  required: ["sentiment", "confidence", "keywords"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "classify_sentiment" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response from AI");

    const result = JSON.parse(toolCall.function.arguments);

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: entry, error: insertError } = await supabase
      .from("feedback_entries")
      .insert({
        content,
        source: source || "manual",
        sentiment: result.sentiment,
        confidence: Math.min(1, Math.max(0, result.confidence)),
        keywords: result.keywords?.slice(0, 5) || [],
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Check for alert conditions - spike in negative sentiment
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: negativeCount } = await supabase
      .from("feedback_entries")
      .select("*", { count: "exact", head: true })
      .eq("sentiment", "negative")
      .gte("created_at", oneHourAgo);

    if (negativeCount && negativeCount >= 3 && result.sentiment === "negative") {
      await supabase.from("sentiment_alerts").insert({
        alert_type: "negative_spike",
        message: `${negativeCount} negative reviews in the last hour. Latest keywords: ${result.keywords?.join(", ")}`,
        severity: negativeCount >= 5 ? "critical" : "warning",
      });
    }

    return new Response(JSON.stringify(entry), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-sentiment error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
