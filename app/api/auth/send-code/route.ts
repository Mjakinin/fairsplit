import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email, code, name } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Code sind erforderlich.' },
        { status: 400 }
      );
    }

    const userName = name || 'FairSplit Nutzer';
    const emailSubject = `${code} ist dein FairSplit Sicherheitscode`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #f0f6fc; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 24px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">FairSplit ⚡</h1>
        <p style="color: #d1fae5; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Smarte Gruppenabrechnung & Beleg-Splitter</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">Hallo ${userName},</h2>
        <p style="color: #8b949e; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
          Verwende den folgenden 6-stelligen Bestätigungscode, um deine E-Mail-Adresse zu verifizieren und dein FairSplit-Konto zu aktivieren:
        </p>
        
        <!-- Code Box -->
        <div style="background-color: #0d1117; border: 2px solid #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 0 0 24px 0;">
          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #10b981;">
            ${code}
          </span>
        </div>

        <p style="color: #8b949e; font-size: 13px; line-height: 1.5; margin: 0;">
          Dieser Code ist für die nächsten 15 Minuten gültig. Falls du diese Registrierung nicht angefordert hast, kannst du diese Nachricht einfach ignorieren.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 24px; background-color: #0d1117; border-top: 1px solid #30363d; text-align: center;">
        <p style="color: #6e7681; font-size: 11px; margin: 0;">
          FairSplit PWA • Sicher & DSGVO-konform
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // 1. Check for Standard SMTP first if configured (e.g. Gmail App-Passwort, Strato, IONOS, Brevo - sends to ALL emails worldwide)
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"FairSplit" <${smtpUser}>`,
          to: email,
          subject: emailSubject,
          html: emailHtml,
        });

        return NextResponse.json({
          success: true,
          emailSent: true,
          provider: 'smtp',
          code,
          message: `E-Mail erfolgreich via SMTP an ${email} gesendet!`,
        });
      } catch (smtpErr: any) {
        console.warn('SMTP Fehler:', smtpErr.message);
      }
    }

    // 2. Check for RESEND_API_KEY (Recommended for verified domains on Vercel / Netlify)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.EMAIL_FROM || 'FairSplit <onboarding@resend.dev>';

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: emailSubject,
          html: emailHtml,
        });

        if (error) {
          console.warn('Resend Hinweis:', error.message);
          return NextResponse.json({
            success: true,
            emailSent: false,
            provider: 'simulated',
            warning: error.message,
            code,
            message: `Resend Sandbox: ${error.message}`,
          });
        }

        return NextResponse.json({
          success: true,
          emailSent: true,
          provider: 'resend',
          id: data?.id,
          code,
          message: `E-Mail erfolgreich via Resend an ${email} gesendet!`,
        });
      } catch (err: any) {
        console.warn('Resend Exception:', err.message);
        return NextResponse.json({
          success: true,
          emailSent: false,
          provider: 'simulated',
          code,
          message: `Code generiert.`,
        });
      }
    }

    // 3. Fallback for Local Development & Previews without configured keys
    return NextResponse.json({
      success: true,
      provider: 'simulated',
      code,
      message: `Code ${code} generiert (Simulations-Modus).`,
    });
  } catch (error: any) {
    console.error('E-Mail Versende-Fehler:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'E-Mail konnte nicht gesendet werden.' },
      { status: 500 }
    );
  }
}
