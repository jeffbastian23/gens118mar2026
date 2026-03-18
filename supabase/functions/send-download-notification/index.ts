import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const DownloadNotificationSchema = z.object({
  documentType: z.enum(["Nota Dinas", "Surat Tugas"]),
  agendaNumber: z.number().int().positive(),
  perihal: z.string().trim().min(1).max(500),
  downloadedBy: z.string().trim().min(1).max(255),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = DownloadNotificationSchema.safeParse(body);
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
    
    const { documentType, agendaNumber, perihal, downloadedBy } = validationResult.data;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Sending download notification:", { documentType, agendaNumber, perihal, downloadedBy });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SIMPEG Notification <onboarding@resend.dev>",
        to: ["umum@bcjatim1.com"], // Change to your verified domain emails after verifying domain at resend.com/domains
        subject: `[SIMPEG] ${documentType} Telah Diunduh - Agenda #${agendaNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Notifikasi Download Dokumen</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Jenis Dokumen:</strong> ${documentType}</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #16a34a;">✓ Telah Diunduh</span></p>
              <p style="margin: 10px 0;"><strong>Nomor Agenda:</strong> ${agendaNumber}</p>
              <p style="margin: 10px 0;"><strong>Perihal:</strong> ${perihal}</p>
              <p style="margin: 10px 0;"><strong>Diunduh oleh:</strong> ${downloadedBy}</p>
              <p style="margin: 10px 0;"><strong>Waktu Download:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Email ini dikirim secara otomatis dari sistem SIMPEG untuk menginformasikan bahwa dokumen telah berhasil diunduh.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errorText);
      throw new Error(`Resend API error: ${emailResponse.status}`);
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
    console.error("Error in send-download-notification function:", error);
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
