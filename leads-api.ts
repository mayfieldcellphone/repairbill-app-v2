import express from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from './db';
import { sendReplyEmail } from './mailer';
import { requireAuth } from './auth-api';

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
        business_id TEXT,
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
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_id TEXT;`);
  } catch (err) {
    console.warn('[Leads] Failed to ensure Postgres table, will fall back to JSON storage per-request:', err);
    if (!fs.existsSync(LEADS_JSON_PATH)) saveLeadsToJSON([]);
  }
}

function fromDbRow(row: any) {
  return {
    id: row.id,
    businessId: row.business_id || null,
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

router.get('/api/leads', requireAuth, async (req: any, res) => {
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const result = await pool.query('SELECT * FROM leads WHERE business_id = $1 ORDER BY created_at DESC', [req.businessId]);
    return res.json(result.rows.map(fromDbRow));
  } catch {
    const leads = loadLeadsFromJSON().filter((l: any) => l.businessId === req.businessId);
    const sorted = leads.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(sorted);
  }
});

router.post('/api/leads', requireAuth, async (req: any, res) => {
  const lead = req.body;
  const id = lead.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    if (lead.id) {
      const existing = await pool.query('SELECT business_id FROM leads WHERE id = $1', [lead.id]);
      if (existing.rows.length > 0 && existing.rows[0].business_id !== req.businessId) {
        return res.status(403).json({ error: 'Not allowed to modify this lead' });
      }
    }
    const sql = `
      INSERT INTO leads (id, business_id, customer_name, customer_email, customer_phone, subject, message, type, status, metadata, replies, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
      id, req.businessId, lead.customerName || '', lead.customerEmail || '', lead.customerPhone || '',
      lead.subject || '', lead.message || '', lead.type || 'contact', lead.status || 'new',
      JSON.stringify(lead.metadata || {}), JSON.stringify(lead.replies || []),
      lead.createdAt || now, now
    ];
    const result = await pool.query(sql, values);
    return res.status(201).json({ success: true, data: fromDbRow(result.rows[0]) });
  } catch {
    const leads = loadLeadsFromJSON();
    const newLead = { ...lead, id, businessId: req.businessId, createdAt: lead.createdAt || now, updatedAt: now, replies: lead.replies || [], metadata: lead.metadata || {} };
    const idx = leads.findIndex((l: any) => l.id === id && l.businessId === req.businessId);
    if (idx >= 0) leads[idx] = { ...leads[idx], ...newLead };
    else leads.push(newLead);
    saveLeadsToJSON(leads);
    res.status(201).json({ success: true, data: newLead });
  }
});

router.patch('/api/leads/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const existingResult = await pool.query('SELECT * FROM leads WHERE id = $1 AND business_id = $2', [id, req.businessId]);
    if (existingResult.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    const existing = fromDbRow(existingResult.rows[0]);
    const merged = { ...existing, ...updates };
    const sql = `
      UPDATE leads SET
        customer_name=$2, customer_email=$3, customer_phone=$4, subject=$5, message=$6,
        type=$7, status=$8, metadata=$9, replies=$10, updated_at=$11
      WHERE id=$1 AND business_id=$12 RETURNING *;
    `;
    const values = [
      id, merged.customerName, merged.customerEmail, merged.customerPhone, merged.subject,
      merged.message, merged.type, merged.status, JSON.stringify(merged.metadata || {}),
      JSON.stringify(merged.replies || []), new Date().toISOString(), req.businessId
    ];
    const result = await pool.query(sql, values);
    return res.json({ success: true, data: fromDbRow(result.rows[0]) });
  } catch {
    const leads = loadLeadsFromJSON();
    const idx = leads.findIndex((l: any) => l.id === id && l.businessId === req.businessId);
    if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
    leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLeadsToJSON(leads);
    res.json({ success: true, data: leads[idx] });
  }
});

router.post('/api/leads/:id/replies', requireAuth, async (req: any, res) => {
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
    const existingResult = await pool.query('SELECT * FROM leads WHERE id = $1 AND business_id = $2', [id, req.businessId]);
    if (existingResult.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    const existing = fromDbRow(existingResult.rows[0]);
    const replies = [...(existing.replies || []), reply];
    const result = await pool.query(
      `UPDATE leads SET replies=$2, status='replied', updated_at=$3 WHERE id=$1 AND business_id=$4 RETURNING *;`,
      [id, JSON.stringify(replies), new Date().toISOString(), req.businessId]
    );
    updatedLead = fromDbRow(result.rows[0]);
  } catch {
    const leads = loadLeadsFromJSON();
    const idx = leads.findIndex((l: any) => l.id === id && l.businessId === req.businessId);
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
    message,
    businessId: req.businessId
  });
  if (!emailResult.sent) {
    console.warn(`[Leads] Reply saved for ${id} but email not sent: ${emailResult.error}`);
  }

  return res.json({ success: true, data: updatedLead, emailSent: emailResult.sent, emailError: emailResult.error });
});

router.delete('/api/leads/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    await pool.query('DELETE FROM leads WHERE id = $1 AND business_id = $2', [id, req.businessId]);
    return res.json({ success: true });
  } catch {
    const leads = loadLeadsFromJSON().filter((l: any) => !(l.id === id && l.businessId === req.businessId));
    saveLeadsToJSON(leads);
    res.json({ success: true });
  }
});

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

  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid or missing API Key' });
  }

  let businessId: string | null = null;
  let businessName = 'Us';
  try {
    const bizResult = await pool.query('SELECT id, name FROM businesses WHERE widget_api_key = $1', [apiKey]);
    if (bizResult.rows.length === 0) {
      const legacyKey = process.env.WEB_LEAD_API_KEY;
      if (legacyKey && apiKey === legacyKey) {
        businessId = process.env.LEGACY_DEFAULT_BUSINESS_ID || null;
      }
      if (!businessId) return res.status(401).json({ error: 'Invalid or missing API Key' });
    } else {
      businessId = bizResult.rows[0].id;
      businessName = bizResult.rows[0].name;
    }
  } catch (err) {
    console.error('[Web Widget] Business lookup failed:', err);
    return res.status(500).json({ error: 'Server error validating API key' });
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
      `INSERT INTO leads (id, business_id, customer_name, customer_email, customer_phone, message, type, status, metadata, replies, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'new',$8,'[]',$9,$9)`,
      [leadId, businessId, customerName, customerEmail || 'no-email@provided.com', customerPhone || '', message, type || 'contact', JSON.stringify(leadMetadata), now]
    );
  } catch {
    const leads = loadLeadsFromJSON();
    leads.push({
      id: leadId,
      businessId,
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

  console.log(`[Web Widget] New lead created for business ${businessId} (${businessName}): ${leadId}`);
  res.status(201).json({ success: true, message: 'Lead successfully recorded in your RepairBill inbox.', leadId });
});

export default router;
