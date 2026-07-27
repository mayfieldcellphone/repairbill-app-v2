import express from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from './db';
import { sendReplyEmail } from './mailer';

const router = express.Router();

const rawDbUrl = process.env.DATABASE_URL;
const isValidDbUrl = Boolean(rawDbUrl && (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://')));

const LEADS_JSON_PATH = path.join(process.cwd(), 'leads.json');

function loadLeadsFromJSON(): any[] {
  try {
    if (fs.existsSync(LEADS_JSON_PATH)) {
      return JSON.parse(fs.readFileSync(LEADS_JSON_PATH, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('[Leads JSON] Error loading:', err);
  }
  return [];
}

function saveLeadsToJSON(leads: any[]) {
  try {
    fs.writeFileSync(LEADS_JSON_PATH, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('[Leads JSON] Error saving:', err);
  }
}

export async function ensureLeadsTable() {
  if (!isValidDbUrl) {
    if (!fs.existsSync(LEADS_JSON_PATH)) saveLeadsToJSON([]);
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'owner',
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        subject TEXT,
        message TEXT,
        type TEXT DEFAULT 'contact',
        status TEXT DEFAULT 'new',
        metadata JSONB DEFAULT '{}',
        replies JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('[Leads] Failed to ensure Postgres table, will fall back to JSON storage per-request:', err);
    if (!fs.existsSync(LEADS_JSON_PATH)) saveLeadsToJSON([]);
  }
}

function fromDbRow(row: any) {
  return {
    id: row.id,
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || '',
    subject: row.subject || '',
    message: row.message || '',
    type: row.type || 'contact',
    status: row.status || 'new',
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
    replies: typeof row.replies === 'string' ? JSON.parse(row.replies) : (row.replies || []),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString()
  };
}

// GET all leads
router.get('/api/leads', async (req, res) => {
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    return res.json(result.rows.map(fromDbRow));
  } catch {
    const leads = loadLeadsFromJSON();
    const sorted = leads.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(sorted);
  }
});

// CREATE or UPDATE (upsert) a lead — used by the dashboard (manual add, imports)
router.post('/api/leads', async (req, res) => {
  const lead = req.body;
  const id = lead.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const sql = `
      INSERT INTO leads (id, customer_name, customer_email, customer_phone, subject, message, type, status, metadata, replies, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (id) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        subject = EXCLUDED.subject,
        message = EXCLUDED.message,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        replies = EXCLUDED.replies,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const values = [
      id, lead.customerName || '', lead.customerEmail || '', lead.customerPhone || '',
      lead.subject || '', lead.message || '', lead.type || 'contact', lead.status || 'new',
      JSON.stringify(lead.metadata || {}), JSON.stringify(lead.replies || []),
      lead.createdAt || now, now
    ];
    const result = await pool.query(sql, values);
    return res.status(201).json({ success: true, data: fromDbRow(result.rows[0]) });
  } catch {
    const leads = loadLeadsFromJSON();
    const newLead = { ...lead, id, createdAt: lead.createdAt || now, updatedAt: now, replies: lead.replies || [], metadata: lead.metadata || {} };
    const idx = leads.findIndex((l: any) => l.id === id);
    if (idx >= 0) leads[idx] = { ...leads[idx], ...newLead };
    else leads.push(newLead);
    saveLeadsToJSON(leads);
    res.status(201).json({ success: true, data: newLead });
  }
});

// PATCH partial update (status changes, edits)
router.patch('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const existingResult = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    const existing = fromDbRow(existingResult.rows[0]);
    const merged = { ...existing, ...updates };
    const sql = `
      UPDATE leads SET
        customer_name=$2, customer_email=$3, customer_phone=$4, subject=$5, message=$6,
        type=$7, status=$8, metadata=$9, replies=$10, updated_at=$11
      WHERE id=$1 RETURNING *;
    `;
    const values = [
      id, merged.customerName, merged.customerEmail, merged.customerPhone, merged.subject,
      merged.message, merged.type, merged.status, JSON.stringify(merged.metadata || {}),
      JSON.stringify(merged.replies || []), new Date().toISOString()
    ];
    const result = await pool.query(sql, values);
    return res.json({ success: true, data: fromDbRow(result.rows[0]) });
  } catch {
    const leads = loadLeadsFromJSON();
    const idx = leads.findIndex((l: any) => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
    leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLeadsToJSON(leads);
    res.json({ success: true, data: leads[idx] });
  }
});

// POST a reply — appends to the conversation thread, marks status 'replied',
// and emails the customer (if SMTP is configured and we have their email).
router.post('/api/leads/:id/replies', async (req, res) => {
  const { id } = req.params;
  const { message, author } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Reply message is required' });

  const reply = {
    id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    message,
    author: author || 'Team',
    createdAt: new Date().toISOString()
  };

  let updatedLead: any = null;

  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const existingResult = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    const existing = fromDbRow(existingResult.rows[0]);
    const replies = [...(existing.replies || []), reply];
    const result = await pool.query(
      `UPDATE leads SET replies=$2, status='replied', updated_at=$3 WHERE id=$1 RETURNING *;`,
      [id, JSON.stringify(replies), new Date().toISOString()]
    );
    updatedLead = fromDbRow(result.rows[0]);
  } catch {
    const leads = loadLeadsFromJSON();
    const idx = leads.findIndex((l: any) => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
    leads[idx].replies = [...(leads[idx].replies || []), reply];
    leads[idx].status = 'replied';
    leads[idx].updatedAt = new Date().toISOString();
    saveLeadsToJSON(leads);
    updatedLead = leads[idx];
  }

  const emailResult = await sendReplyEmail({
    to: updatedLead.customerEmail,
    customerName: updatedLead.customerName,
    message
  });
  if (!emailResult.sent) {
    console.warn(`[Leads] Reply saved for ${id} but email not sent: ${emailResult.error}`);
  }

  return res.json({ success: true, data: updatedLead, emailSent: emailResult.sent, emailError: emailResult.error });
});

// DELETE a lead
router.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch {
    const leads = loadLeadsFromJSON().filter((l: any) => l.id !== id);
    saveLeadsToJSON(leads);
    res.json({ success: true });
  }
});

/**
 * PUBLIC Website Widget Intake Endpoint
 * Used by the embeddable chat widget (public/repairbill-widget.js) and any
 * custom website contact forms. Protected by a single static API key
 * (WEB_LEAD_API_KEY env var) rather than a per-user Firestore lookup, since
 * Leads no longer depend on Firebase/Firestore at all.
 *
 * Set WEB_LEAD_API_KEY in your server environment (e.g. PM2 env config),
 * then use that same value as the Bearer token from your website.
 *
 * CORS: this endpoint is called directly from third-party browser tabs
 * (the customer's own website, e.g. mayfieldphonerepair.com.au), so it needs
 * its own permissive CORS headers — it does NOT rely on cookies/credentials,
 * only a Bearer API key, so Access-Control-Allow-Origin: * is safe here.
 */
router.options('/api/web-integration/leads', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

router.post('/api/web-integration/leads', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  let apiKey = req.headers['authorization']?.toString().replace('Bearer ', '');
  if (!apiKey) apiKey = req.query.apiKey as string;

  const expectedKey = process.env.WEB_LEAD_API_KEY;
  if (!expectedKey) {
    return res.status(500).json({
      error: 'Server not configured',
      message: 'WEB_LEAD_API_KEY is not set on the server. Set it in your environment to enable the website widget.'
    });
  }
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid or missing API Key' });
  }

  const { customerName, customerEmail, customerPhone, message, type, metadata } = req.body;
  if (!customerName || !message) {
    return res.status(400).json({ error: 'Missing required fields: customerName and message are required.' });
  }

  const leadId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const leadMetadata = {
    source: req.headers['referer'] || 'External Website',
    integratedVia: 'RepairBill Web Widget',
    ...metadata
  };

  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    await pool.query(
      `INSERT INTO leads (id, customer_name, customer_email, customer_phone, message, type, status, metadata, replies, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'new',$7,'[]',$8,$8)`,
      [leadId, customerName, customerEmail || 'no-email@provided.com', customerPhone || '', message, type || 'contact', JSON.stringify(leadMetadata), now]
    );
  } catch {
    const leads = loadLeadsFromJSON();
    leads.push({
      id: leadId,
      customerName,
      customerEmail: customerEmail || 'no-email@provided.com',
      customerPhone: customerPhone || '',
      message,
      type: type || 'contact',
      status: 'new',
      replies: [],
      createdAt: now,
      updatedAt: now,
      metadata: leadMetadata
    });
    saveLeadsToJSON(leads);
  }

  console.log(`[Web Widget] New lead created: ${leadId}`);
  res.status(201).json({ success: true, message: 'Lead successfully recorded in your RepairBill inbox.', leadId });
});

export default router;
