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
    const { questions, userAnswers, userInfo } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    // Calculate score
    let correct = 0;
    const results = questions.map((q: any, i: number) => {
      const userAnswer = userAnswers[i] || "";
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correct++;
      return {
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        user_answer: userAnswer,
        is_correct: isCorrect,
        reasoning: q.reasoning,
      };
    });

    const score = Math.round((correct / questions.length) * 100);
    const weakAreas: string[] = [];
    results.forEach((r: any) => {
      if (!r.is_correct) weakAreas.push(r.question);
    });

    // Get AI evaluation
    const evalPrompt = `You are an expert educator evaluating a student's test performance.

Student: ${userInfo.name}, Class: ${userInfo.className}, Topic: ${userInfo.topic}
Score: ${score}% (${correct}/${questions.length} correct)
Difficulty: ${userInfo.difficulty}

Questions they got wrong:
${weakAreas.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Provide a JSON response with:
{
  "summary": "2-3 sentence overall performance summary",
  "strengths": ["list of areas where student did well"],
  "weaknesses": ["list of areas needing improvement"],
  "suggestions": ["3-5 specific improvement suggestions"]
}

Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: "You are a JSON-only response bot." },
          { role: "user", content: evalPrompt },
        ],
        temperature: 0.5,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq eval error:", response.status, errText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "{}";
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch {
      evaluation = { summary: "Evaluation could not be parsed.", strengths: [], weaknesses: [], suggestions: [] };
    }

    return new Response(JSON.stringify({
      results,
      score,
      correct,
      total: questions.length,
      evaluation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
