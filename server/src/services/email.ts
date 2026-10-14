import nodemailer from 'nodemailer';
import { FRONTEND_URL } from '../lib/config.js';

// HTML escape function to prevent XSS in email templates
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Roost';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration incomplete. Email sending disabled.');
      return;
    }

    const config: EmailConfig = {
      host,
      port,
      secure,
      auth: { user, pass },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify SMTP connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection verification failed:', error.message);
      } else if (success) {
        console.log('SMTP connection verified successfully');
      }
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not configured. Check SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(params: {
    email: string;
    name: string;
    productName: string;
    variantName?: string;
    resetPasswordUrl: string;
  }): Promise<boolean> {
    const { email, name, productName, variantName, resetPasswordUrl } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || 'där');
    const safeProductName = escapeHtml(productName);
    const safeEmail = escapeHtml(email);
    const planType = escapeHtml(variantName || 'Prenumeration');
    const frontendUrl = FRONTEND_URL;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Välkommen till ${this.fromName}</title>
</head>
<body style="font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0E2A4D; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #185DA9; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Välkommen till ${this.fromName}!</h1>
  </div>

  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #D5E1EE; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px; margin-top: 0;">Hej ${safeName},</p>

    <p>Tack för ditt köp av <strong>${safeProductName}</strong> (${planType})! Ditt konto har skapats och du är redo att bli en del av vår community.</p>

    <div style="background: #F3F7FC; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 600;">Dina kontouppgifter:</p>
      <p style="margin: 0;">E-post: <strong>${safeEmail}</strong></p>
    </div>

    <p>För att komma igång, välj ditt lösenord genom att klicka på knappen nedan:</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetPasswordUrl}" style="display: inline-block; background: #185DA9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Välj ditt lösenord</a>
    </div>

    <p style="color: #4A5B73; font-size: 14px;">Länken är giltig i 24 timmar. Om du inte gjorde det här köpet kan du ignorera det här mejlet.</p>

    <hr style="border: none; border-top: 1px solid #D5E1EE; margin: 32px 0;">

    <p style="margin-bottom: 0;">När du har valt ditt lösenord kan du:</p>
    <ul style="margin-top: 8px;">
      <li>Ta del av allt innehåll och alla diskussioner i communityn</li>
      <li>Knyta kontakt med andra medlemmar</li>
      <li>Delta i evenemang och aktiviteter</li>
    </ul>

    <p>Vi är glada att ha dig med! Hör gärna av dig om du har några frågor.</p>

    <p style="margin-bottom: 0;">Vänliga hälsningar,<br><strong>${this.fromName}-teamet</strong></p>
  </div>

  <div style="text-align: center; padding: 20px; color: #5C7190; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${this.fromName}. Alla rättigheter förbehållna.</p>
    <p style="margin: 8px 0 0 0;">
      <a href="${frontendUrl}" style="color: #4A5B73;">Besök vår plattform</a>
    </p>
  </div>
</body>
</html>
    `;

    const text = `
Välkommen till ${this.fromName}!

Hej ${safeName},

Tack för ditt köp av ${safeProductName} (${planType})! Ditt konto har skapats och du är redo att bli en del av vår community.

Dina kontouppgifter:
E-post: ${safeEmail}

För att komma igång, välj ditt lösenord genom att besöka:
${resetPasswordUrl}

Länken är giltig i 24 timmar.

När du har valt ditt lösenord kan du:
- Ta del av allt innehåll och alla diskussioner i communityn
- Knyta kontakt med andra medlemmar
- Delta i evenemang och aktiviteter

Vi är glada att ha dig med!

Vänliga hälsningar,
${this.fromName}-teamet
    `;

    return this.sendEmail({
      to: email,
      subject: `Välkommen till ${this.fromName} - ${productName}`,
      html,
      text,
    });
  }

  async sendSubscriptionCancelledEmail(params: {
    email: string;
    name: string;
    productName: string;
    gracePeriodEnds: Date;
  }): Promise<boolean> {
    const { email, name, productName, gracePeriodEnds } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || 'där');
    const safeProductName = escapeHtml(productName);
    const formattedDate = gracePeriodEnds.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0E2A4D; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #F5A118; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #0E2A4D; margin: 0; font-size: 24px;">Prenumeration uppsagd</h1>
  </div>

  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #D5E1EE; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px; margin-top: 0;">Hej ${safeName},</p>

    <p>Vi är ledsna att se dig lämna oss! Din prenumeration på <strong>${safeProductName}</strong> har sagts upp.</p>

    <div style="background: #FBC231; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #F5A118;">
      <p style="margin: 0; font-weight: 600;">Goda nyheter: du har fortfarande åtkomst!</p>
      <p style="margin: 8px 0 0 0;">Din åtkomst gäller till och med <strong>${formattedDate}</strong> (7 dagars respitperiod).</p>
    </div>

    <p>Om du ångrar dig kan du när som helst återaktivera din prenumeration i dina kontoinställningar.</p>

    <p style="margin-bottom: 0;">Vänliga hälsningar,<br><strong>${this.fromName}-teamet</strong></p>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Din prenumeration på ${productName} har sagts upp`,
      html,
    });
  }

  async sendSubscriptionReactivatedEmail(params: {
    email: string;
    name: string;
    productName: string;
  }): Promise<boolean> {
    const { email, name, productName } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || 'där');
    const safeProductName = escapeHtml(productName);
    const frontendUrl = FRONTEND_URL;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0E2A4D; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #32D7CD; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #0E2A4D; margin: 0; font-size: 24px;">Välkommen tillbaka!</h1>
  </div>

  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #D5E1EE; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px; margin-top: 0;">Hej ${safeName},</p>

    <p>Goda nyheter! Din prenumeration på <strong>${safeProductName}</strong> har återaktiverats.</p>

    <p>Du har nu full tillgång till alla communityfunktioner igen. Vi är glada att ha dig tillbaka!</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${frontendUrl}" style="display: inline-block; background: #185DA9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Gå till communityn</a>
    </div>

    <p style="margin-bottom: 0;">Vänliga hälsningar,<br><strong>${this.fromName}-teamet</strong></p>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Välkommen tillbaka! Din prenumeration på ${productName} är aktiv`,
      html,
    });
  }

  async sendPasswordResetEmail(params: {
    email: string;
    name: string;
    resetUrl: string;
  }): Promise<boolean> {
    const { email, name, resetUrl } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || 'där');
    const safeEmail = escapeHtml(email);
    const frontendUrl = FRONTEND_URL;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Återställ ditt lösenord</title>
</head>
<body style="font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0E2A4D; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #185DA9; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Återställ ditt lösenord</h1>
  </div>

  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #D5E1EE; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px; margin-top: 0;">Hej ${safeName},</p>

    <p>Vi har tagit emot en begäran om att återställa lösenordet för ditt ${this.fromName}-konto kopplat till <strong>${safeEmail}</strong>.</p>

    <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #185DA9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Återställ lösenord</a>
    </div>

    <p style="color: #4A5B73; font-size: 14px;">Länken är giltig i <strong>1 timme</strong>. Om du inte begärde en lösenordsåterställning kan du ignorera det här mejlet – ditt lösenord förblir oförändrat.</p>

    <hr style="border: none; border-top: 1px solid #D5E1EE; margin: 32px 0;">

    <p style="color: #5C7190; font-size: 13px; margin-bottom: 0;">
      Om knappen inte fungerar, kopiera och klistra in den här länken i din webbläsare:<br>
      <a href="${resetUrl}" style="color: #185DA9; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #5C7190; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${this.fromName}. Alla rättigheter förbehållna.</p>
    <p style="margin: 8px 0 0 0;">
      <a href="${frontendUrl}" style="color: #4A5B73;">Besök vår plattform</a>
    </p>
  </div>
</body>
</html>
    `;

    const text = `
Återställ ditt lösenord

Hej ${safeName},

Vi har tagit emot en begäran om att återställa lösenordet för ditt ${this.fromName}-konto kopplat till ${safeEmail}.

Klicka på länken nedan för att återställa ditt lösenord:
${resetUrl}

Länken är giltig i 1 timme. Om du inte begärde en lösenordsåterställning kan du ignorera det här mejlet – ditt lösenord förblir oförändrat.

Vänliga hälsningar,
${this.fromName}-teamet
    `;

    return this.sendEmail({
      to: email,
      subject: `Återställ ditt lösenord för ${this.fromName}`,
      html,
      text,
    });
  }

  async sendNotificationEmail(params: {
    to: string;
    userName: string;
    notificationType: string;
    title: string;
    message?: string;
    link?: string;
  }): Promise<boolean> {
    const { to, userName, notificationType, title, message, link } = params;
    const safeName = escapeHtml(userName || 'där');
    const safeTitle = escapeHtml(title);
    const safeMessage = message ? escapeHtml(message) : '';
    const frontendUrl = FRONTEND_URL;

    // Get notification type specific styling
    const { color, headerText, icon, subject } = this.getNotificationTypeStyles(notificationType, title);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0E2A4D; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${color}; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="font-size: 32px; margin-bottom: 8px;">${icon}</div>
    <h1 style="color: ${headerText}; margin: 0; font-size: 22px;">${safeTitle}</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #D5E1EE; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hej ${safeName},</p>

    ${safeMessage ? `
    <div style="background: #F3F7FC; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
      <p style="margin: 0; color: #334862; font-style: italic;">"${safeMessage}${safeMessage.length >= 100 ? '...' : ''}"</p>
    </div>
    ` : ''}

    ${link ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: #185DA9; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">Visa på plattformen</a>
    </div>
    ` : ''}

    <p style="color: #4A5B73; font-size: 14px; margin-bottom: 0;">
      Du kan hantera dina notisinställningar i dina <a href="${frontendUrl}/settings" style="color: #185DA9;">kontoinställningar</a>.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #5C7190; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${this.fromName}. Alla rättigheter förbehållna.</p>
    <p style="margin: 8px 0 0 0;">
      <a href="${frontendUrl}" style="color: #4A5B73;">Besök vår plattform</a>
    </p>
  </div>
</body>
</html>
    `;

    const text = `
${title}

Hej ${safeName},

${message || ''}

${link ? `Visa på plattformen: ${link}` : ''}

Du kan hantera dina notisinställningar i dina kontoinställningar på ${frontendUrl}/settings

---
${this.fromName}
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendActivationStatusEmail(params: {
    email: string;
    name: string;
    productName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    websiteUrl: string;
    adminNotes?: string;
  }): Promise<boolean> {
    const { email, name, productName, status, websiteUrl, adminNotes } = params;
    const safeName = escapeHtml(name || 'där');
    const safeProductName = escapeHtml(productName);
    const safeWebsiteUrl = escapeHtml(websiteUrl);
    const safeAdminNotes = adminNotes ? escapeHtml(adminNotes) : '';
    const frontendUrl = FRONTEND_URL;

    // Status-specific configuration.
    // Färger ur profilens palett (designsystem.md): headerText = mörk text på
    // orange/teal/röd, vit endast på blått; textColor = statusfärg som är
    // läsbar som text på ljus botten (blå, mörkblå eller error-strong).
    const statusConfig = {
      pending: {
        color: '#F5A118', // brand-orange
        headerText: '#0E2A4D',
        textColor: '#0E2A4D',
        icon: '⏳',
        title: 'Aktiveringsförfrågan mottagen',
        message: `Din aktiveringsförfrågan för <strong>${safeProductName}</strong> har tagits emot och väntar på granskning.`,
      },
      in_progress: {
        color: '#185DA9', // brand-blue
        headerText: '#ffffff',
        textColor: '#185DA9',
        icon: '⚙️',
        title: 'Aktivering pågår',
        message: `Goda nyheter! Din aktivering av <strong>${safeProductName}</strong> behandlas nu.`,
      },
      completed: {
        color: '#32D7CD', // brand-teal
        headerText: '#0E2A4D',
        textColor: '#0E2A4D',
        icon: '✅',
        title: 'Aktivering slutförd',
        message: `Goda nyheter! <strong>${safeProductName}</strong> har aktiverats på din webbplats.`,
      },
      rejected: {
        color: '#EC5345', // brand-red
        headerText: '#0E2A4D',
        textColor: '#B23327',
        icon: '❌',
        title: 'Uppdatering om din aktiveringsförfrågan',
        message: `Din aktiveringsförfrågan för <strong>${safeProductName}</strong> har granskats.`,
      },
    };

    const config = statusConfig[status];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
</head>
<body style="font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0E2A4D; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${config.color}; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="font-size: 40px; margin-bottom: 8px;">${config.icon}</div>
    <h1 style="color: ${config.headerText}; margin: 0; font-size: 24px;">${config.title}</h1>
  </div>

  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #D5E1EE; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px; margin-top: 0;">Hej ${safeName},</p>

    <p>${config.message}</p>

    <div style="background: #F3F7FC; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #334862;">Uppgifter om förfrågan:</p>
      <p style="margin: 0; color: #4A5B73;">
        <strong>Produkt:</strong> ${safeProductName}<br>
        <strong>Webbplats:</strong> ${safeWebsiteUrl}<br>
        <strong>Status:</strong> <span style="color: ${config.textColor}; font-weight: 600;">${status.replace('_', ' ').toUpperCase()}</span>
      </p>
    </div>

    ${safeAdminNotes ? `
    <div style="background: #FBC231; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #F5A118;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #0E2A4D;">Meddelande från vårt team:</p>
      <p style="margin: 0; color: #0E2A4D;">${safeAdminNotes}</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${frontendUrl}/activations" style="display: inline-block; background: #185DA9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Visa mina aktiveringar</a>
    </div>

    <p style="margin-bottom: 0;">Vänliga hälsningar,<br><strong>${this.fromName}-teamet</strong></p>
  </div>

  <div style="text-align: center; padding: 20px; color: #5C7190; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${this.fromName}. Alla rättigheter förbehållna.</p>
    <p style="margin: 8px 0 0 0;">
      <a href="${frontendUrl}" style="color: #4A5B73;">Besök vår plattform</a>
    </p>
  </div>
</body>
</html>
    `;

    const text = `
${config.title}

Hej ${safeName},

${config.message.replace(/<[^>]*>/g, '')}

Uppgifter om förfrågan:
- Produkt: ${safeProductName}
- Webbplats: ${safeWebsiteUrl}
- Status: ${status.replace('_', ' ').toUpperCase()}

${safeAdminNotes ? `Meddelande från vårt team: ${safeAdminNotes}` : ''}

Visa dina aktiveringar på: ${frontendUrl}/activations

Vänliga hälsningar,
${this.fromName}-teamet
    `;

    return this.sendEmail({
      to: email,
      subject: `${config.title} - ${productName}`,
      html,
      text,
    });
  }

  // Profilens palett (se docs/redesign/designsystem.md). headerText följer
  // kontrastreglerna: mörk text (#0E2A4D) på teal/orange/gul/röd, vit text
  // endast på blått/lila.
  private getNotificationTypeStyles(type: string, title: string): { color: string; headerText: string; icon: string; subject: string } {
    switch (type) {
      case 'new_comment':
        return {
          color: '#185DA9', // brand-blue
          headerText: '#ffffff',
          icon: '💬',
          subject: `Ny kommentar: ${title}`,
        };
      case 'comment_reply':
        return {
          color: '#159EDA', // brand-sky
          headerText: '#0E2A4D',
          icon: '↩️',
          subject: `Nytt svar: ${title}`,
        };
      case 'new_reaction':
        return {
          color: '#EC5345', // brand-red
          headerText: '#0E2A4D',
          icon: '❤️',
          subject: `Ny reaktion: ${title}`,
        };
      case 'new_message':
        return {
          color: '#185DA9', // brand-blue
          headerText: '#ffffff',
          icon: '✉️',
          subject: title,
        };
      case 'mention':
        return {
          color: '#F5A118', // brand-orange
          headerText: '#0E2A4D',
          icon: '@',
          subject: `Du blev omnämnd: ${title}`,
        };
      case 'group_invite':
        return {
          color: '#652FA0', // brand-purple
          headerText: '#ffffff',
          icon: '👥',
          subject: `Inbjudan till klassrum: ${title}`,
        };
      case 'new_follower':
        return {
          color: '#32D7CD', // brand-teal
          headerText: '#0E2A4D',
          icon: '👤',
          subject: `Ny följare: ${title}`,
        };
      case 'event_reminder':
        return {
          color: '#FBC231', // brand-yellow
          headerText: '#0E2A4D',
          icon: '📅',
          subject: `Påminnelse om evenemang: ${title}`,
        };
      default:
        return {
          color: '#185DA9', // brand-blue
          headerText: '#ffffff',
          icon: '🔔',
          subject: title,
        };
    }
  }
}

export const emailService = new EmailService();
