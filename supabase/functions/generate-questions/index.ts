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
    const { name, className, age, topic, difficulty, numQuestions } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const count = Math.min(Math.max(numQuestions || 5, 5), 10);

    const prompt = `You are an expert educator. Generate exactly ${count} multiple choice questions for a student with the following profile:
- Name: ${name}
- Class: ${className}
- Age: ${age}
- Topic: ${topic}
- Difficulty: ${difficulty}

Return ONLY valid JSON — no markdown, no extra text, no code fences. The response must be a JSON array:
[
  {
    "question": "string",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_answer": "A",
    "reasoning": "Explanation why this is correct"
  }
]

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- correct_answer must be one of: "A", "B", "C", "D"
- Questions should be appropriate for the student's class level and age
- Vary question difficulty according to the selected difficulty level
- Make questions educational and engaging`;

    let attempts = 0;
    let questions = null;

    while (attempts < 3 && !questions) {
      attempts++;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: "You are a JSON-only response bot. Never include markdown or extra text." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Groq API error (attempt ${attempts}):`, response.status, errText);
        if (attempts >= 3) throw new Error(`Groq API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content?.trim();
      if (!content) { continue; }

      // Strip markdown fences if present
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      try {
        questions = JSON.parse(content);
        if (!Array.isArray(questions) || questions.length === 0) {
          questions = null;
          continue;
        }
        // Validate structure
        for (const q of questions) {
          if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correct_answer || !q.reasoning) {
            questions = null;
            break;
          }
        }
      } catch {
        console.error(`JSON parse failed (attempt ${attempts})`);
        questions = null;
      }
    }

    if (!questions) {
      throw new Error("Failed to generate valid questions after 3 attempts");
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
