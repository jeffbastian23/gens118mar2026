import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const RequestSchema = z.object({
  query: z.string().trim().min(1, "Query cannot be empty").max(500, "Query must be less than 500 characters"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { query } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client for auth verification
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search across all tables
    const [employeesResult, assignmentsResult, plhKepalaResult] = await Promise.all([
      supabase.from('employees').select('*').limit(100),
      supabase.from('assignments').select('*').limit(100),
      supabase.from('plh_kepala').select('*').limit(100),
    ]);

    const employees = employeesResult.data || [];
    const assignments = assignmentsResult.data || [];
    const plhKepala = plhKepalaResult.data || [];

    // Prepare context for AI
    const context = {
      employees: employees.map(e => ({
        id: e.id,
        nama: e.nm_pegawai,
        nip: e.nip,
        pangkat: e.uraian_pangkat,
        jabatan: e.uraian_jabatan,
        unit: e.nm_unit_organisasi
      })),
      assignments: assignments.map(a => ({
        id: a.id,
        agenda: a.agenda_number,
        perihal: a.perihal,
        tempat: a.tempat_penugasan,
        tanggal: a.hari_tanggal_kegiatan
      })),
      plhKepala: plhKepala.map(p => ({
        id: p.id,
        perihal: p.perihal,
        nomor: p.nomor_naskah_dinas,
        tanggal: p.tanggal
      }))
    };

    // Call AI to process the query
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Anda adalah asisten AI untuk database sistem kepegawaian. Jawab pertanyaan pengguna tentang data dalam database secara umum dan informatif.
            
Database memiliki 3 tabel utama:
1. employees (pegawai): nama, NIP, pangkat, jabatan, unit organisasi
2. assignments (penugasan): agenda, perihal, tempat penugasan, tanggal kegiatan
3. plh_kepala: perihal, nomor naskah dinas, tanggal

Berikan response dalam format JSON dengan struktur:
{
  "answer": "jawaban singkat dan jelas dalam bahasa Indonesia",
  "results": {
    "employees": [array of matching employee IDs if relevant],
    "assignments": [array of matching assignment IDs if relevant],
    "plhKepala": [array of matching plh_kepala IDs if relevant]
  }
}

Jawab pertanyaan umum tentang data (berapa jumlah, siapa yang, dimana, kapan, dll) dengan informatif dan akurat berdasarkan data yang ada.`
          },
          {
            role: 'user',
            content: `Data dalam database: ${JSON.stringify(context)}\n\nPertanyaan: "${query}"`
          }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI Gateway error', details: errorText }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse AI response
    let searchResults;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      searchResults = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      searchResults = {
        answer: aiContent,
        results: { employees: [], assignments: [], plhKepala: [] }
      };
    }

    // Get full details for matched items
    const matchedEmployees = employees.filter(e => searchResults.results?.employees?.includes(e.id));
    const matchedAssignments = assignments.filter(a => searchResults.results?.assignments?.includes(a.id));
    const matchedPlhKepala = plhKepala.filter(p => searchResults.results?.plhKepala?.includes(p.id));

    return new Response(
      JSON.stringify({
        answer: searchResults.answer || '',
        employees: matchedEmployees,
        assignments: matchedAssignments,
        plhKepala: matchedPlhKepala,
        summary: searchResults.summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
