import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const ensureInvoicesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(createTableQuery);
    console.log('Invoices table ensured.');
  } catch (err) {
    console.error('Error ensuring invoices table:', err);
  }
};

export default pool;
