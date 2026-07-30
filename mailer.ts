import nodemailer from 'nodemailer';
import { pool } from './db';

let transporter: nodemailer.Transporter | null = null;
let transporterKey = '';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const key = `${host}:${port}:${user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  transporterKey = key;
  return transporter;
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getSenderIdentity(businessId?: string): Promise<{ fromName: string; replyTo?: string }> {
  const fallbackName = process.env.SMTP_FROM_NAME || 'RepairBill';
  if (!businessId) return { fromName: fallbackName };
  try {
    const result = await pool.query('SELECT sender_name, sender_email, name FROM businesses WHERE id = $1', [businessId]);
    if (result.rows.length === 0) return { fromName: fallbackName };
    const row = result.rows[0];
    return {
      fromName: row.sender_name || row.name || fallbackName,
      replyTo: row.sender_email || undefined
    };
  } catch {
    return { fromName: fallbackName };
  }
}

// Sends via the Resend HTTP API. Used when RESEND_API_KEY is set and the business
// has its own sender email on a domain that's been verified in Resend. If the
// domain isn't verified yet, Resend returns an error and the caller falls back to SMTP.
async function sendViaResend(opts: {
  to: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY not configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${opts.fromName} <${opts.fromEmail}>`,
        to: [opts.to],
        reply_to: opts.replyTo,
        subject: opts.subject,
        text: opts.text,
        html: opts.html
      })
    });
    if (!res.ok) {
      const errBody = await res.text();
      return { sent: false, error: `Resend error ${res.status}: ${errBody}` };
    }
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || 'Resend request failed' };
  }
}

export async function sendReplyEmail(opts: {
  to: string;
  customerName?: string;
  message: string;
  companyName?: string;
  businessId?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!opts.to || opts.to === 'no-email@provided.com') {
    return { sent: false, error: 'No customer email on file for this lead' };
  }

  const identity = await getSenderIdentity(opts.businessId);
  const fromName = opts.companyName || identity.fromName;

  const subject = `Re: Your message to ${fromName}`;
  const text = opts.message;
  const html = `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;">
    ${opts.customerName ? `<p>Hi ${escapeHtml(opts.customerName)},</p>` : ''}
    <p>${escapeHtml(opts.message).replace(/\n/g, '<br>')}</p>
    <p style="margin-top: 24px; color: #666; font-size: 13px;">— ${escapeHtml(fromName)}</p>
  </div>`;

  // Prefer Resend when configured and this business has its own sender email set.
  if (process.env.RESEND_API_KEY && identity.replyTo) {
    const resendResult = await sendViaResend({
      to: opts.to,
      fromName,
      fromEmail: identity.replyTo,
      subject,
      text,
      html
    });
    if (resendResult.sent) return { sent: true };
    console.warn('[Mailer] Resend send failed, falling back to SMTP:', resendResult.error);
  }

  const t = getTransporter();
  if (!t) return { sent: false, error: 'SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing)' };
  const fromAddress = process.env.SMTP_USER as string;

  try {
    await t.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      replyTo: identity.replyTo,
      to: opts.to,
      subject,
      text,
      html
    });
    return { sent: true };
  } catch (err: any) {
    console.error('[Mailer] Failed to send reply email:', err);
    return { sent: false, error: err?.message || 'Unknown error sending email' };
  }
}
