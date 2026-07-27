import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

// ---------------------------------------------------------------------------
// Types (loosely) + row mapper
// ---------------------------------------------------------------------------
function fromBusinessRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    loginEmail: row.login_email,
    widgetApiKey: row.widget_api_key,
    senderName: row.sender_name || row.name,
    senderEmail: row.sender_email || '',
    resendDomainId: row.resend_domain_id || null,
    resendDomainStatus: row.resend_domain_status || 'unverified',
    widgetColor: row.widget_color || '#2563eb',
    createdAt: row.created_at
  };
}

function generateApiKey() {
  return 'rb_' + crypto.randomBytes(24).toString('hex');
}

function generateId() {
  return 'biz_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/** Verifies the dashboard JWT (Authorization: Bearer <jwt>) and attaches req.businessId */
export function requireAuth(req: any, res: any, next: any) {
  const header = req.headers['authorization']?.toString() || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { businessId: string };
    req.businessId = payload.businessId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

/** Gates the admin-provisioning routes with a single shared secret (x-admin-key header) */
export function requireAdmin(req: any, res: any, next: any) {
  if (!ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Server not configured', message: 'ADMIN_API_KEY is not set on the server.' });
  }
  const key = req.headers['x-admin-key']?.toString() || '';
  if (key !== ADMIN_API_KEY) return res.status(401).json({ error: 'Invalid admin key' });
  next();
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
export async function ensureBusinessesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      login_email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      widget_api_key TEXT UNIQUE NOT NULL,
      sender_name TEXT,
      sender_email TEXT,
      resend_domain_id TEXT,
      resend_domain_status TEXT DEFAULT 'unverified',
      widget_color TEXT DEFAULT '#2563eb',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

router.post('/api/auth/bootstrap', async (req, res) => {
  const { uid, name, apiKey } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid is required' });
  try {
    const existing = await pool.query('SELECT * FROM businesses WHERE id = $1', [uid]);
    let row;
    if (existing.rows.length > 0) {
      row = existing.rows[0];
    } else {
      const widgetApiKey = (apiKey && String(apiKey).trim()) || generateApiKey();
      const placeholderHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const result = await pool.query(
        `INSERT INTO businesses (id, name, login_email, password_hash, widget_api_key, sender_name)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING *;`,
        [uid, name || 'My Business', `${uid}@bootstrap.local`, placeholderHash, widgetApiKey, name || 'My Business']
      );
      row = result.rows[0];
    }
    const token = jwt.sign({ businessId: row.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, token, business: fromBusinessRow(row) });
  } catch (err: any) {
    console.error('[Auth] Bootstrap failed:', err);
    return res.status(500).json({ error: 'Bootstrap failed', message: err?.message });
  }
});

router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE login_email = $1', [String(email).toLowerCase().trim()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ businessId: row.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, token, business: fromBusinessRow(row) });
  } catch (err: any) {
    console.error('[Auth] Login failed:', err);
    return res.status(500).json({ error: 'Login failed', message: err?.message });
  }
});

router.get('/api/me', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [req.businessId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json(fromBusinessRow(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load profile', message: err?.message });
  }
});

router.patch('/api/me', requireAuth, async (req: any, res) => {
  const { name, senderName, widgetColor } = req.body;
  try {
    const result = await pool.query(
      `UPDATE businesses SET
        name = COALESCE($2, name),
        sender_name = COALESCE($3, sender_name),
        widget_color = COALESCE($4, widget_color)
       WHERE id = $1 RETURNING *;`,
      [req.businessId, name, senderName, widgetColor]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json({ success: true, data: fromBusinessRow(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile', message: err?.message });
  }
});

router.post('/api/me/rotate-widget-key', requireAuth, async (req: any, res) => {
  try {
    const newKey = generateApiKey();
    const result = await pool.query(
      'UPDATE businesses SET widget_api_key = $2 WHERE id = $1 RETURNING *;',
      [req.businessId, newKey]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json({ success: true, data: fromBusinessRow(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to rotate widget key', message: err?.message });
  }
});

router.get('/api/admin/businesses', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM businesses ORDER BY created_at DESC');
    res.json(result.rows.map(fromBusinessRow));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list businesses', message: err?.message });
  }
});

router.post('/api/admin/businesses', requireAdmin, async (req, res) => {
  const { name, loginEmail, password, senderName } = req.body;
  if (!name || !loginEmail || !password) {
    return res.status(400).json({ error: 'name, loginEmail, and password are required' });
  }
  try {
    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 10);
    const widgetApiKey = generateApiKey();
    const result = await pool.query(
      `INSERT INTO businesses (id, name, login_email, password_hash, widget_api_key, sender_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`,
      [id, name, String(loginEmail).toLowerCase().trim(), passwordHash, widgetApiKey, senderName || name]
    );
    res.status(201).json({ success: true, data: fromBusinessRow(result.rows[0]) });
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'A business with that login email already exists' });
    console.error('[Admin] Failed to create business:', err);
    res.status(500).json({ error: 'Failed to create business', message: err?.message });
  }
});

router.delete('/api/admin/businesses/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM businesses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete business', message: err?.message });
  }
});

router.post('/api/admin/businesses/:id/reset-password', requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password is required' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE businesses SET password_hash = $2 WHERE id = $1 RETURNING *;',
      [req.params.id, passwordHash]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json({ success: true, data: fromBusinessRow(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password', message: err?.message });
  }
});

export default router;
