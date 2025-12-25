// Edge Function Supabase pour envoyer des notifications de récompense par email
// Pour déployer : supabase functions deploy send-reward-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer les paramètres de la requête
    const { email, userName, rewardAmount, txHash, month, year } = await req.json()

    if (!email) {
      throw new Error('Email requis')
    }

    // Créer le client Supabase avec les clés d'admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Nom du mois en français
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    const monthName = monthNames[month - 1] || ''

    // Obtenir l'URL de l'application (avant de créer le template)
    const appUrl = Deno.env.get('APP_URL') || 'https://wenze.com';

    // Créer le contenu de l'email
    const emailSubject = `🎉 Votre récompense WZP de ${monthName} ${year} a été envoyée !`
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Récompense WZP envoyée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Félicitations !</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
    <p style="font-size: 16px;">Bonjour ${userName || 'Utilisateur'},</p>
    
    <p style="font-size: 16px;">
      Nous sommes heureux de vous informer que votre récompense mensuelle WZP pour <strong>${monthName} ${year}</strong> a été envoyée avec succès !
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-size: 14px; color: #666;">Montant de la récompense</p>
      <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #667eea;">${rewardAmount.toFixed(2)} ADA</p>
    </div>
    
    ${txHash ? `
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Transaction ID</p>
      <p style="margin: 0; font-family: monospace; font-size: 12px; word-break: break-all; color: #333;">${txHash}</p>
      <a href="https://preprod.cardanoscan.io/transaction/${txHash}" 
         style="display: inline-block; margin-top: 10px; color: #667eea; text-decoration: none; font-size: 14px;">
        Voir sur Cardanoscan →
      </a>
    </div>
    ` : ''}
    
    <p style="font-size: 16px;">
      Les fonds ont été envoyés à l'adresse Cardano que vous avez fournie lors de votre réclamation.
    </p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>💡 Note :</strong> La transaction peut prendre quelques minutes à être confirmée sur la blockchain Cardano. 
        Vérifiez votre wallet pour confirmer la réception.
      </p>
    </div>
    
    <p style="font-size: 16px;">
      Continuez à utiliser WENZE pour gagner plus de points WZP et participer au classement mensuel !
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}/leaderboard" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Voir le classement
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      Si vous avez des questions, n'hésitez pas à nous contacter.<br>
      <br>
      L'équipe WENZE
    </p>
  </div>
</body>
</html>
`

    // Utiliser Resend pour envoyer l'email
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'WENZE <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY non configurée. Email non envoyé.');
      console.log('📧 Email de notification (non envoyé - mode dev):', {
        to: email,
        subject: emailSubject,
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'RESEND_API_KEY non configurée. Configurez-la dans Supabase Dashboard → Project Settings → Edge Functions → Secrets',
          error: 'Email service not configured'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Vérifier si on utilise le domaine de test Resend (onboarding@resend.dev)
    // En mode test, Resend ne permet d'envoyer qu'à l'adresse email du compte
    const isTestDomain = fromEmail.includes('@resend.dev') || fromEmail.includes('onboarding@');

    // Envoyer l'email via Resend
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: emailSubject,
          html: emailBody,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error('❌ Erreur Resend API:', errorData);
        
        // Parser l'erreur pour donner un message plus clair
        let errorMessage = `Resend API error: ${resendResponse.status}`;
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.message) {
            errorMessage = errorJson.message;
            
            // Message spécial pour l'erreur 403 de domaine non vérifié
            if (errorJson.message.includes('You can only send testing emails')) {
              errorMessage = `Domain non vérifié: Vous ne pouvez envoyer des emails qu'à votre propre adresse en mode test. Pour envoyer à d'autres destinataires, vérifiez un domaine sur resend.com/domains et mettez à jour RESEND_FROM_EMAIL. Détails: ${errorJson.message}`;
            }
          }
        } catch {
          errorMessage = errorData;
        }
        
        throw new Error(errorMessage);
      }

      const resendResult = await resendResponse.json();
      console.log('✅ Email envoyé avec succès via Resend:', {
        to: email,
        messageId: resendResult.id,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification envoyée avec succès',
          messageId: resendResult.id,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (emailError: any) {
      console.error('❌ Erreur lors de l\'envoi de l\'email via Resend:', emailError);
      throw emailError;
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de la notification:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur lors de l\'envoi de la notification' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

