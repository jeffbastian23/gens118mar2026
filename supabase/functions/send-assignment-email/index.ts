import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in email content
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Input validation schema
const AssignmentEmailSchema = z.object({
  action: z.enum(["created", "updated"]),
  agendaNumber: z.number().int().positive(),
  perihal: z.string().trim().min(1).max(500),
  createdBy: z.string().trim().min(1).max(255),
  nomorNaskahDinas: z.string().trim().min(1).max(255),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = AssignmentEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    const { action, agendaNumber, perihal, createdBy, nomorNaskahDinas } = validationResult.data;

    // Sanitize all user-provided content for HTML
    const sanitizedPerihal = escapeHtml(perihal);
    const sanitizedCreatedBy = escapeHtml(createdBy);
    const sanitizedNomorNaskahDinas = escapeHtml(nomorNaskahDinas);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Sending email notification:", { action, agendaNumber, userEmail: user.email });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SIMPEG Notification <onboarding@resend.dev>",
        to: ["notifikasi@kemenkeu.go.id", "duana.pahlawan@kemenkeu.go.id"],
        subject: `[SIMPEG] ${action === "created" ? "Surat/Nota Dinas Baru" : "Perubahan Surat/Nota Dinas"} - Agenda #${agendaNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Notifikasi Surat/Nota Dinas</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Status:</strong> ${action === "created" ? "Dibuat Baru" : "Diperbarui"}</p>
              <p style="margin: 10px 0;"><strong>Nomor Agenda:</strong> ${agendaNumber}</p>
              <p style="margin: 10px 0;"><strong>Nomor Naskah Dinas:</strong> ${sanitizedNomorNaskahDinas}</p>
              <p style="margin: 10px 0;"><strong>Perihal:</strong> ${sanitizedPerihal}</p>
              <p style="margin: 10px 0;"><strong>${action === "created" ? "Dibuat oleh" : "Diubah oleh"}:</strong> ${sanitizedCreatedBy}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Email ini dikirim secara otomatis dari sistem SIMPEG.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errorText);
      // Return success with warning instead of throwing - don't block main functionality
      return new Response(JSON.stringify({ 
        success: false, 
        warning: "Email notification skipped - domain not verified in Resend",
        details: errorText 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-assignment-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
