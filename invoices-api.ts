import express from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from './db';
import { requireAuth } from './auth-api';

const router = express.Router();

const rawDbUrl = process.env.DATABASE_URL;
const isValidDbUrl = Boolean(rawDbUrl && (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://')));

const INVOICES_JSON_PATH = path.join(process.cwd(), 'invoices.json');

function loadInvoicesFromJSON(): any[] {
  try {
    if (fs.existsSync(INVOICES_JSON_PATH)) {
      return JSON.parse(fs.readFileSync(INVOICES_JSON_PATH, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('[Invoices JSON] Error loading:', err);
  }
  return [];
}

function saveInvoicesToJSON(invoices: any[]) {
  try {
    fs.writeFileSync(INVOICES_JSON_PATH, JSON.stringify(invoices, null, 2), 'utf8');
  } catch (err) {
    console.error('[Invoices JSON] Error saving:', err);
  }
}

function fromDbRow(row: any) {
  return {
    id: row.id,
    businessId: row.business_id || row.businessId || null,
    invoiceNumber: row.invoice_number ?? row.invoiceNumber ?? '',
    customerName: row.customer_name ?? row.customerName ?? '',
    customerEmail: row.customer_email ?? row.customerEmail ?? '',
    customerPhone: row.customer_phone ?? row.customerPhone ?? '',
    customerCompany: row.customer_company ?? row.customerCompany ?? '',
    customerNotes: row.customer_notes ?? row.customerNotes ?? '',
    date: row.date || row.created_at || new Date().toISOString(),
    dueDate: row.due_date ?? row.dueDate ?? row.created_at ?? new Date().toISOString(),
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    subtotal: row.subtotal ? parseFloat(row.subtotal) : 0,
    taxAmount: row.tax_amount ? parseFloat(row.tax_amount) : (row.taxAmount ? parseFloat(row.taxAmount) : 0),
    total: row.total ? parseFloat(row.total) : 0,
    status: row.status || 'draft',
    type: row.type || 'invoice',
    paymentMethod: row.payment_method ?? row.paymentMethod ?? 'Other'
  };
}

// Every route below is scoped to req.businessId (set by requireAuth from the dashboard JWT).
// When Postgres isn't reachable, we fall back to a per-business-filtered read/write of
// invoices.json so one business can never see or touch another business's invoices.

router.get('/api/invoices', requireAuth, async (req: any, res) => {
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    const result = await pool.query('SELECT * FROM invoices WHERE business_id = $1 ORDER BY created_at DESC', [req.businessId]);
    return res.json(result.rows.map(fromDbRow));
  } catch (error) {
    try {
      const invoices = loadInvoicesFromJSON().filter((inv: any) => (inv.business_id || inv.businessId) === req.businessId);
      const sorted = invoices.map(fromDbRow).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      return res.json(sorted);
    } catch (jsonError) {
      console.error('Error fetching invoices:', jsonError);
      return res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  }
});

router.post('/api/invoices', requireAuth, async (req: any, res) => {
  const inv = req.body;
  const now = new Date().toISOString();

  try {
    if (!isValidDbUrl) throw new Error('NO_DB');

    if (inv.id) {
      const existing = await pool.query('SELECT business_id FROM invoices WHERE id = $1', [inv.id]);
      if (existing.rows.length > 0 && existing.rows[0].business_id && existing.rows[0].business_id !== req.businessId) {
        return res.status(403).json({ error: 'Not allowed to modify this invoice' });
      }
    }

    const sql = `
      INSERT INTO invoices (
        id, invoice_number, customer_name, customer_email, customer_phone, items,
        subtotal, tax_amount, total, status, date, due_date, type, payment_method,
        customer_company, customer_notes, business_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        invoice_number = EXCLUDED.invoice_number,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        items = EXCLUDED.items,
        subtotal = EXCLUDED.subtotal,
        tax_amount = EXCLUDED.tax_amount,
        total = EXCLUDED.total,
        status = EXCLUDED.status,
        date = EXCLUDED.date,
        due_date = EXCLUDED.due_date,
        type = EXCLUDED.type,
        payment_method = EXCLUDED.payment_method,
        customer_company = EXCLUDED.customer_company,
        customer_notes = EXCLUDED.customer_notes
      RETURNING *;
    `;

    const values = [
      inv.id, inv.invoiceNumber, inv.customerName, inv.customerEmail, inv.customerPhone || '',
      JSON.stringify(inv.items || []), inv.subtotal || 0, inv.taxAmount || 0, inv.total || 0,
      inv.status || 'draft', inv.date || now, inv.dueDate || now,
      inv.type || 'invoice', inv.paymentMethod || 'Other', inv.customerCompany || '', inv.customerNotes || '',
      req.businessId
    ];

    const result = await pool.query(sql, values);
    return res.status(201).json({ success: true, data: fromDbRow(result.rows[0]) });
  } catch (error) {
    try {
      const id = inv.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const invoices = loadInvoicesFromJSON();

      const existingIndex = invoices.findIndex((row: any) => row.id === id);
      if (existingIndex >= 0) {
        const existingBizId = invoices[existingIndex].business_id || invoices[existingIndex].businessId;
        if (existingBizId && existingBizId !== req.businessId) {
          return res.status(403).json({ error: 'Not allowed to modify this invoice' });
        }
      }

      const newRow = {
        id,
        business_id: req.businessId,
        invoice_number: inv.invoiceNumber || '',
        customer_name: inv.customerName || '',
        customer_email: inv.customerEmail || '',
        customer_phone: inv.customerPhone || '',
        items: inv.items || [],
        subtotal: inv.subtotal || 0,
        tax_amount: inv.taxAmount || 0,
        total: inv.total || 0,
        status: inv.status || 'draft',
        date: inv.date || now,
        due_date: inv.dueDate || now,
        type: inv.type || 'invoice',
        payment_method: inv.paymentMethod || 'Other',
        customer_company: inv.customerCompany || '',
        customer_notes: inv.customerNotes || '',
        created_at: existingIndex >= 0 ? (invoices[existingIndex].created_at || now) : now
      };

      if (existingIndex >= 0) invoices[existingIndex] = { ...invoices[existingIndex], ...newRow };
      else invoices.push(newRow);

      saveInvoicesToJSON(invoices);
      return res.status(201).json({ success: true, data: fromDbRow(newRow) });
    } catch (jsonError) {
      console.error('Error saving invoice:', jsonError);
      return res.status(500).json({ error: 'Failed to save invoice' });
    }
  }
});

router.delete('/api/invoices/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  try {
    if (!isValidDbUrl) throw new Error('NO_DB');
    await pool.query('DELETE FROM invoices WHERE id = $1 AND business_id = $2', [id, req.businessId]);
    return res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    try {
      const invoices = loadInvoicesFromJSON();
      const filtered = invoices.filter((row: any) => !(row.id === id && (row.business_id || row.businessId) === req.businessId));
      saveInvoicesToJSON(filtered);
      return res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (jsonError) {
      console.error('Error deleting invoice:', jsonError);
      return res.status(500).json({ error: 'Failed to delete invoice' });
    }
  }
});

export default router;
