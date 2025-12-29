import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: 'deposit_approved' | 'deposit_rejected' | 'withdrawal_approved' | 'withdrawal_rejected';
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, amount }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to user ${userId} for amount ${amount}`);

    // Create Supabase client with service role to access user email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, username')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Could not find user email:", profileError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, username } = profile;
    const formattedAmount = `$${amount.toFixed(2)}`;
    
    let subject = "";
    let heading = "";
    let message = "";
    let statusColor = "";

    switch (type) {
      case 'deposit_approved':
        subject = "Your deposit has been approved! 💰";
        heading = "Deposit Approved";
        message = `Great news! Your deposit of ${formattedAmount} has been approved and added to your wallet balance.`;
        statusColor = "#22c55e";
        break;
      case 'deposit_rejected':
        subject = "Deposit request update";
        heading = "Deposit Rejected";
        message = `We're sorry, but your deposit request of ${formattedAmount} was not approved. Please contact support if you have questions.`;
        statusColor = "#ef4444";
        break;
      case 'withdrawal_approved':
        subject = "Your withdrawal is on the way! 🎉";
        heading = "Withdrawal Approved";
        message = `Your withdrawal request of ${formattedAmount} has been approved and is being processed. You should receive your funds shortly.`;
        statusColor = "#22c55e";
        break;
      case 'withdrawal_rejected':
        subject = "Withdrawal request update";
        heading = "Withdrawal Rejected";
        message = `We're sorry, but your withdrawal request of ${formattedAmount} was not approved. Please contact support if you have questions.`;
        statusColor = "#ef4444";
        break;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #22c55e; font-size: 28px; margin: 0;">EarnTask</h1>
              </div>
              
              <div style="background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: ${statusColor}; margin: 0 0 10px 0; font-size: 24px;">${heading}</h2>
                <p style="color: #e0e0e0; margin: 0; font-size: 16px;">Amount: <strong>${formattedAmount}</strong></p>
              </div>
              
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                Hi ${username || 'there'},
              </p>
              
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://earntask.lovable.app/wallet" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Your Wallet
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center;">
                This email was sent by EarnTask. If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "EarnTask <onboarding@resend.dev>",
      to: [email],
      subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw emailError;
    }

    console.log(`Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
