import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInfo, score, weaknesses, evaluation } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const prompt = `You are an expert learning coach. Create a 7-day personalized learning roadmap.

Student profile:
- Name: ${userInfo.name}
- Class: ${userInfo.className}
- Age: ${userInfo.age}
- Topic: ${userInfo.topic}
- Difficulty: ${userInfo.difficulty}
- Test Score: ${score}%
- Weak areas: ${JSON.stringify(weaknesses)}

Return ONLY valid JSON with this structure:
{
  "title": "7-Day Learning Roadmap for [topic]",
  "overview": "Brief roadmap overview",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "goals": ["goal 1", "goal 2"],
      "activities": ["activity 1", "activity 2"],
      "resources": [
        { "title": "Resource name", "url": "https://youtube.com/...", "type": "video" },
        { "title": "Resource name", "url": "https://www.geeksforgeeks.org/...", "type": "article" },
        { "title": "Resource name", "url": "https://docs...", "type": "documentation" }
      ],
      "practice": "Practice exercise description"
    }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- Include real YouTube, GeeksForGeeks, and documentation links relevant to the topic
- Make each day build upon the previous
- Focus more on weak areas
- Include both theory and practice
- Be specific and actionable
- No markdown, only valid JSON`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: "You are a JSON-only response bot. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq roadmap error:", response.status, errText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "{}";
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let roadmap;
    try {
      roadmap = JSON.parse(content);
    } catch {
      roadmap = { title: "Learning Roadmap", overview: "Could not generate roadmap.", days: [], tips: [] };
    }

    return new Response(JSON.stringify({ roadmap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-roadmap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
