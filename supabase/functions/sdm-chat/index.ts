import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, tema, faqContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Anda adalah asisten AI untuk Tim UPK (Unit Pengelolaan Kepegawaian) Bea Cukai. Tugas Anda adalah menjawab pertanyaan seputar kepegawaian dengan ramah dan profesional.

Tema yang sedang dibahas: ${tema}

Konteks FAQ yang tersedia:
${faqContext || "Tidak ada FAQ terkait."}

Panduan:
1. Jawab dengan bahasa Indonesia yang sopan dan profesional
2. Jika pertanyaan terkait dengan FAQ, gunakan informasi dari FAQ
3. Jika tidak yakin dengan jawaban, sarankan untuk menghubungi agent Tim UPK secara langsung
4. Berikan informasi yang akurat seputar kepegawaian PNS seperti kenaikan pangkat, cuti, absensi, mutasi, pensiun, dll
5. Jangan memberikan informasi yang tidak relevan dengan kepegawaian
6. Jawaban harus singkat dan jelas (maksimal 2-3 paragraf)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded",
          needsAgent: true 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          needsAgent: true 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ 
        error: "AI gateway error",
        needsAgent: true 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        needsAgent: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sdm-chat error:", e);
    return new Response(
      JSON.stringify({ 
        error: e instanceof Error ? e.message : "Unknown error",
        needsAgent: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
