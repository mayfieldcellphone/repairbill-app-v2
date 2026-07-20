import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const ensureInvoicesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'owner',
        invoice_number TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        customer_company TEXT,
        customer_notes TEXT,
        date TEXT,
        due_date TEXT,
        items JSONB,
        subtotal DECIMAL(10, 2),
        tax_amount DECIMAL(10, 2),
        total DECIMAL(10, 2),
        status TEXT,
        type TEXT,
        payment_method TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(createTableQuery);
    console.log('[PostgreSQL] Invoices table ensured.');
  } catch (err) {
    console.error('[PostgreSQL] Error ensuring invoices table:', err);
  }
};

export default pool;
