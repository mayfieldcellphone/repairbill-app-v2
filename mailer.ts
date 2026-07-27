import nodemailer from 'nodemailer';

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

/**
 * Sends a reply email to a customer whose lead came in through the RepairBill
 * inbox (website widget, manual entry, etc). Configured via env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME (optional)
 * Silently no-ops (returns sent:false) if SMTP isn't configured or the lead
 * has no real customer email on file, so this never blocks the core
 * save-the-reply-to-the-thread behavior.
 */
export async function sendReplyEmail(opts: {
  to: string;
  customerName?: string;
  message: string;
  companyName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { sent: false, error: 'SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing)' };
  if (!opts.to || opts.to === 'no-email@provided.com') {
    return { sent: false, error: 'No customer email on file for this lead' };
  }

  const fromName = process.env.SMTP_FROM_NAME || opts.companyName || 'RepairBill';
  const fromAddress = process.env.SMTP_USER as string;

  try {
    await t.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: opts.to,
      subject: `Re: Your message to ${fromName}`,
      text: opts.message,
      html: `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;">
        ${opts.customerName ? `<p>Hi ${escapeHtml(opts.customerName)},</p>` : ''}
        <p>${escapeHtml(opts.message).replace(/\n/g, '<br>')}</p>
        <p style="margin-top: 24px; color: #666; font-size: 13px;">— ${escapeHtml(fromName)}</p>
      </div>`
    });
    return { sent: true };
  } catch (err: any) {
    console.error('[Mailer] Failed to send reply email:', err);
    return { sent: false, error: err?.message || 'Unknown error sending email' };
  }
}
