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

Analyze this message in the context of the conversation history. Return ONLY a valid JSON object with these exact fields (no markdown, no code fences, no explanation):

{
  "intent": "<one of: Cooperation, Proposal, Information Sharing, Unresolved Concern, Resistance, Reassurance, Concession, Conditional Agreement, Urgent Escalation, Active Coordination, Needs Disclosure, Value Proposition, Objection Handling, Partnership Building, or a new intent label if none fit>",
  "alignment": <integer 0-100, how aligned the speakers appear to be>,
  "friction": <integer 0-100, level of resistance or tension>,
  "urgency": <integer 0-100, pressure to act>,
  "trajectory": "<one of: converging, diverging, stable, escalating, de-escalating>",
  "sentiment": "<two or three word description of emotional tone>",
  "recommendation": "<one sentence actionable recommendation for the other speaker>",
  "intentShift": <boolean, true if the intent has meaningfully shifted from the previous message's intent>,
  "shiftDescription": "<if intentShift is true, describe the shift in one sentence; otherwise empty string>"
}

Guidelines:
- alignment and friction are generally inversely correlated but not always
- urgency should spike when language becomes pressing or escalatory
- trajectory reflects where the conversation is heading, not just the current message
- intentShift should be true only when there is a genuine directional change, not just a different topic
- Be precise and analytical, not generic. Base your analysis on the actual words and context.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiResponse.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
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
      analysis = JSON.parse(cleaned);
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
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
