const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ConversationMessage {
  speaker: string;
  text: string;
}

interface AnalyzeRequest {
  message: string;
  speaker: string;
  history: ConversationMessage[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, speaker, history } = await req.json() as AnalyzeRequest;

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Message text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured. Set GEMINI_API_KEY as an edge function secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const historyText = history && history.length > 0
      ? history.map((m) => `Speaker ${m.speaker}: "${m.text}"`).join("\n")
      : "(No prior messages — this is the first message in the conversation.)";

    const systemPrompt = `You are CONCORD, a real-time conversational intelligence analysis system. You analyze individual messages within an ongoing conversation and provide structured analytical signals.

CONVERSATION HISTORY (most recent last):
${historyText}

CURRENT MESSAGE TO ANALYZE:
Speaker ${speaker}: "${message}"

Analyze this message in the context of the conversation history.

Guidelines:
- alignment and friction are generally inversely correlated but not always
- urgency should spike when language becomes pressing or escalatory
- trajectory reflects where the conversation is heading, not just the current message
- intentShift should be true only when there is a genuine directional change, not just a different topic
- Be precise and analytical, not generic. Base your analysis on the actual words and context.
- Watch for sarcasm and tone that contradicts literal word choice — do not score based on keyword presence alone.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                intent: { type: "string" },
                alignment: { type: "integer" },
                friction: { type: "integer" },
                urgency: { type: "integer" },
                trajectory: {
                  type: "string",
                  enum: ["converging", "diverging", "stable", "escalating", "de-escalating"],
                },
                sentiment: { type: "string" },
                recommendation: { type: "string" },
                intentShift: { type: "boolean" },
                shiftDescription: { type: "string" },
              },
              required: [
                "intent", "alignment", "friction", "urgency", "trajectory",
                "sentiment", "recommendation", "intentShift", "shiftDescription",
              ],
            },
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiResponse.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Gemini returned no content. Full response:", JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: "Gemini returned no content" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        analysis = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("Failed to parse Gemini output. Raw text was:", rawText);
        return new Response(
          JSON.stringify({ error: `Gemini returned malformed JSON: ${(parseErr as Error).message}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));
    analysis.alignment = clamp(analysis.alignment ?? 50, 0, 100);
    analysis.friction = clamp(analysis.friction ?? 10, 0, 100);
    analysis.urgency = clamp(analysis.urgency ?? 20, 0, 100);
    analysis.intentShift = Boolean(analysis.intentShift);
    analysis.shiftDescription = analysis.shiftDescription || "";

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
