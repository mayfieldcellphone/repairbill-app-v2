import express from 'express';
import { query } from './db';
import admin from 'firebase-admin';

const router = express.Router();

// Firebase Auth Middleware
router.use(async (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Firebase token verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
});

// --- INVOICES ---

// GET /api/invoices
router.get('/api/invoices', async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const result = await query("SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    
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
router.post('/api/invoices', async (req: any, res) => {
  const inv = req.body;
  const userId = req.user.uid;
  try {
    const sql = `
      INSERT INTO invoices (
        id, user_id, invoice_number, customer_name, customer_email, 
        customer_phone, customer_company, customer_notes, date, due_date, 
        items, subtotal, tax_amount, total, status, type, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET 
        status = EXCLUDED.status,
        total = EXCLUDED.total,
        items = EXCLUDED.items
      RETURNING *;
    `;
    
    const values = [
      inv.id, userId, inv.invoiceNumber, inv.customerName, inv.customerEmail, 
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

// --- CUSTOMERS ---

// GET /api/customers
router.get('/api/customers', async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const result = await query("SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    
    // Map database columns to camelCase
    const customers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      notes: row.notes,
      createdAt: row.created_at
    }));
    
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/customers
// ... (POST logic remains same)

// --- EXPENSES ---

// GET /api/expenses
router.get('/api/expenses', async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const result = await query("SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    
    // Map database columns to camelCase
    const expenses = result.rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: parseFloat(row.amount),
      category: row.category,
      date: row.date,
      paymentMethod: row.payment_method,
      supplier: row.supplier,
      createdAt: row.created_at
    }));
    
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/expenses
router.post('/api/expenses', async (req: any, res) => {
  const exp = req.body;
  const userId = req.user.uid;
  try {
    const sql = `
      INSERT INTO expenses (id, user_id, description, amount, category, date, payment_method, supplier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET 
        description = EXCLUDED.description,
        amount = EXCLUDED.amount
      RETURNING *;
    `;
    const values = [exp.id, userId, exp.description, exp.amount, exp.category, exp.date, exp.paymentMethod, exp.supplier];
    const result = await query(sql, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/expenses/:id
router.delete('/api/expenses/:id', async (req: any, res) => {
  try {
    const userId = req.user.uid;
    await query("DELETE FROM expenses WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
