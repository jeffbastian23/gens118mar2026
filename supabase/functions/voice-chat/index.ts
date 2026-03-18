import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the token is valid
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect query type and search accordingly
    const lowerMessage = message.toLowerCase();
    let employeeContext = '';
    
    // Check if asking about counts/totals
    const isCountQuery = lowerMessage.includes('berapa') || 
                        lowerMessage.includes('jumlah') || 
                        lowerMessage.includes('total');
    
    // Check if asking about specific organizational unit
    const orgUnitMatch = lowerMessage.match(/(?:kantor|wilayah|djbc|jatim|surabaya|malang|madiun)/gi);
    
    if (isCountQuery || orgUnitMatch) {
      // For count queries or organizational queries, fetch relevant data
      let query = supabase.from('employees').select('*');
      
      // If specific organizational unit mentioned, filter by it
      if (orgUnitMatch && orgUnitMatch.length > 0) {
        const orgTerms = orgUnitMatch.join(' ');
        query = query.ilike('nm_unit_organisasi', `%${orgTerms}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Database error:', error);
      } else if (data) {
        const totalCount = data.length;
        const uniqueUnits = [...new Set(data.map((emp: any) => emp.nm_unit_organisasi))];
        
        employeeContext = `\n\nData dari database:\n`;
        employeeContext += `- Total pegawai: ${totalCount}\n`;
        if (uniqueUnits.length > 0) {
          employeeContext += `- Unit organisasi: ${uniqueUnits.join(', ')}\n`;
        }
        
        // Add sample employees if count is small
        if (data.length <= 10) {
          employeeContext += `\nDaftar pegawai:\n` + 
            data.map((emp: any) => 
              `- ${emp.nm_pegawai}: ${emp.uraian_jabatan} di ${emp.nm_unit_organisasi}`
            ).join('\n');
        }
      }
    } else {
      // Search by employee name
      const words = message.split(' ');
      const potentialNames = words.filter((word: string) => 
        word.length > 2 && /^[A-Z]/.test(word)
      );
      
      let employees: any[] = [];
      
      if (potentialNames.length > 0) {
        for (const name of potentialNames) {
          const { data, error } = await supabase
            .from('employees')
            .select('*')
            .ilike('nm_pegawai', `%${name}%`);
          
          if (data && data.length > 0) {
            employees = [...employees, ...data];
          }
          if (error) {
            console.error('Database error:', error);
          }
        }
      }

      // Remove duplicates
      const uniqueEmployees = Array.from(
        new Map(employees.map((emp: any) => [emp.id, emp])).values()
      );

      if (uniqueEmployees.length > 0) {
        employeeContext = '\n\nInformasi pegawai dari database:\n' + 
          uniqueEmployees.map((emp: any) => 
            `- ${emp.nm_pegawai}: ${emp.uraian_jabatan} di ${emp.nm_unit_organisasi}, ${emp.uraian_pangkat}`
          ).join('\n');
      }
    }

    console.log('Sending message to Lovable AI:', message);
    console.log('Employee context:', employeeContext);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Anda adalah asisten virtual untuk sistem penugasan pegawai Bea dan Cukai. Jawab dengan singkat, jelas, dan dalam Bahasa Indonesia. Gunakan informasi dari database pegawai yang tersedia untuk menjawab pertanyaan tentang pegawai.'
          },
          {
            role: 'user',
            content: message + employeeContext
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat memproses permintaan Anda.';

    console.log('AI Response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
