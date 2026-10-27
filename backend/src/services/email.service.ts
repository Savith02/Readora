import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// undefined = not created yet, null = SMTP is not configured.
let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  transporter =
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
      ? nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465, // 465 is TLS from the start; 587 upgrades with STARTTLS
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        })
      : null;
  return transporter;
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** "readora02@gmail.com" -> "r*******@gmail.com", for logs that should not hold full addresses. */
export const maskEmail = (address: string): string => {
  const [local = '', domain = ''] = address.split('@');
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
};

export interface PasswordResetEmail {
  to: string;
  name: string;
  link: string;
  /** How long the link works, shown in the message. */
  validForMinutes: number;
}

export function buildPasswordResetMessage({ to, name, link, validForMinutes }: PasswordResetEmail): SendMailOptions {
  const from = env.EMAIL_FROM ?? (env.SMTP_USER ? `Readora <${env.SMTP_USER}>` : 'Readora <no-reply@readora.local>');
  const lifetime = validForMinutes >= 60 ? `${Math.round(validForMinutes / 60)} hour` : `${validForMinutes} minutes`;

  return {
    from,
    to,
    subject: 'Reset your Readora password',
    text: [
      `Hi ${name},`,
      '',
      'Someone asked to reset the password for your Readora account. To choose a new one, open this link:',
      '',
      link,
      '',
      `The link works once and expires in ${lifetime}.`,
      'If you did not ask for this, you can ignore this email. Your password will not change.',
      '',
      'The Readora team',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1c2030; line-height: 1.5;">
        <h2 style="margin: 0 0 16px;">Reset your password</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Someone asked to reset the password for your Readora account. To choose a new one, use the button below.</p>
        <p style="margin: 28px 0;">
          <a href="${escapeHtml(link)}" style="background: #1b2640; color: #faf5e8; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold;">Choose a new password</a>
        </p>
        <p style="font-size: 14px; color: #62687a;">The link works once and expires in ${lifetime}. If the button does not work, paste this address into your browser:<br><span style="word-break: break-all;">${escapeHtml(link)}</span></p>
        <p style="font-size: 14px; color: #62687a;">If you did not ask for this, you can ignore this email. Your password will not change.</p>
      </div>`,
  };
}

/**
 * Sends the reset email. With no SMTP settings, development prints the link in the terminal
 * instead, and production only logs that nothing could be sent. The link itself is never logged in production.
 */
export async function sendPasswordResetEmail(email: PasswordResetEmail): Promise<void> {
  const transport = getTransporter();

  if (!transport) {
    if (env.NODE_ENV === 'production') {
      logger.error('A password reset was requested but SMTP is not configured, so no email was sent');
    } else {
      logger.info(`SMTP is not configured, so no email was sent. Password reset link for ${email.to}:\n  ${email.link}`);
    }
    return;
  }

  await transport.sendMail(buildPasswordResetMessage(email));
  logger.info(`Password reset email sent to ${maskEmail(email.to)}`);
}
