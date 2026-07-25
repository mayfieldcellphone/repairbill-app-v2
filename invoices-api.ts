import express from 'express';
import { query } from './db';
const router = express.Router();

function fromDbRow(row: any) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number || '',
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || '',
    customerCompany: row.customer_company || '',
    customerNotes: row.customer_notes || '',
    date: row.date || row.created_at || new Date().toISOString(),
    dueDate: row.due_date || row.created_at || new Date().toISOString(),
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    subtotal: row.subtotal ? parseFloat(row.subtotal) : 0,
    taxAmount: row.tax_amount ? parseFloat(row.tax_amount) : 0,
    total: row.total ? parseFloat(row.total) : 0,
    status: row.status || 'draft',
    type: row.type || 'invoice',
    paymentMethod: row.payment_method || 'Other'
  };
}

router.get('/api/invoices', async (req, res) => {
  try {
    const result = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    const invoices = result.rows.map(fromDbRow);
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices from PostgreSQL:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.post('/api/invoices', async (req, res) => {
  try {
    const inv = req.body;
    
    // Support full insert & update on conflict
    const sql = `
      INSERT INTO invoices (
        id, 
        invoice_number, 
        customer_name, 
        customer_email, 
        customer_phone, 
        items, 
        subtotal, 
        tax_amount, 
        total, 
        status,
        date,
        due_date,
        type,
        payment_method,
        customer_company,
        customer_notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
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
      inv.id, 
      inv.invoiceNumber, 
      inv.customerName, 
      inv.customerEmail, 
      inv.customerPhone || '', 
      JSON.stringify(inv.items || []), 
      inv.subtotal || 0, 
      inv.taxAmount || 0, 
      inv.total || 0, 
      inv.status || 'draft',
      inv.date || new Date().toISOString(),
      inv.dueDate || new Date().toISOString(),
      inv.type || 'invoice',
      inv.paymentMethod || 'Other',
      inv.customerCompany || '',
      inv.customerNotes || ''
    ];

    const result = await query(sql, values);
    res.status(201).json({ success: true, data: fromDbRow(result.rows[0]) });
  } catch (error) {
    console.error("Error saving invoice to PostgreSQL:", error);
    res.status(500).json({ error: "Failed to save invoice" });
  }
});

// Support deleting invoices
router.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM invoices WHERE id = $1 RETURNING *;`;
    await query(sql, [id]);
    res.json({ success: true, message: "Invoice deleted successfully from backend database" });
  } catch (error) {
    console.error("Error deleting invoice from PostgreSQL:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
