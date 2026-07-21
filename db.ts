import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const ensureTables = async () => {
  const createInvoicesTable = `
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
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

  const createCustomersTable = `
    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createExpensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category TEXT,
        date TEXT,
        payment_method TEXT,
        supplier TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await query(createInvoicesTable);
    await query(createCustomersTable);
    await query(createExpensesTable);
    console.log('[PostgreSQL] All tables ensured.');
  } catch (err) {
    console.error('[PostgreSQL] Error ensuring tables:', err);
  }
};

export default pool;
