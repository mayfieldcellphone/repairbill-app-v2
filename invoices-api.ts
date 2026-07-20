import express from 'express';
import { query } from './db';

const router = express.Router();

// Internal API Key security check
router.use((req, res, next) => {
    const apiKey = req.headers['x-internal-api-key'];
    if (apiKey !== process.env.VITE_INTERNAL_API_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid Internal API Key' });
    }
    next();
});

// GET /api/invoices
router.get('/api/invoices', async (req, res) => {
  try {
    const result = await query("SELECT * FROM invoices WHERE user_id = 'owner' ORDER BY created_at DESC");
    
    // Map database columns to camelCase for the React app
    const invoices = result.rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerCompany: row.customer_company,
      customerNotes: row.customer_notes,
      date: row.date,
      dueDate: row.due_date,
      items: row.items,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      total: parseFloat(row.total),
      status: row.status,
      type: row.type,
      paymentMethod: row.payment_method,
      createdAt: row.created_at
    }));
    
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/invoices
router.post('/api/invoices', async (req, res) => {
  const inv = req.body;
  try {
    const sql = `
      INSERT INTO invoices (
        id, user_id, invoice_number, customer_name, customer_email, 
        customer_phone, customer_company, customer_notes, date, due_date, 
        items, subtotal, tax_amount, total, status, type, payment_method
      ) VALUES ($1, 'owner', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET 
        status = EXCLUDED.status,
        total = EXCLUDED.total,
        items = EXCLUDED.items
      RETURNING *;
    `;
    
    const values = [
      inv.id, inv.invoiceNumber, inv.customerName, inv.customerEmail, 
      inv.customerPhone, inv.customerCompany, inv.customerNotes, inv.date, inv.dueDate, 
      JSON.stringify(inv.items), inv.subtotal, inv.taxAmount, inv.total, 
      inv.status, inv.type, inv.paymentMethod
    ];
    
    const result = await query(sql, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
