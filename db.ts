import { Pool } from 'pg';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const rawDbUrl = process.env.DATABASE_URL;
const isValidDbUrl = Boolean(rawDbUrl && (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://')));
const connectionString = isValidDbUrl ? rawDbUrl! : 'postgres://repairbill_user:22UyeLThWKxxe3Wd@localhost:5432/repairbill_db';
const isRemoteDb = Boolean(isValidDbUrl && !rawDbUrl!.includes('localhost') && !rawDbUrl!.includes('127.0.0.1'));

if (isValidDbUrl) {
  console.log('[PostgreSQL] Using DATABASE_URL from secrets/environment for database connections.');
} else {
  console.log('[PostgreSQL] Valid DATABASE_URL not detected in environment, using local JSON storage mode.');
}

const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: isRemoteDb ? 10000 : 1000,
  ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {})
});

// Exported so other modules (e.g. leads-api.ts) can reuse the same connection pool
// and implement their own table-specific JSON-file fallback logic.
export { pool };

const JSON_FILE_PATH = path.join(process.cwd(), 'invoices.json');

// Helper to load invoices from JSON
function loadFromJSON(): any[] {
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      const data = fs.readFileSync(JSON_FILE_PATH, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('[JSON DB] Error loading invoices:', err);
  }
  return [];
}

// Helper to save invoices to JSON
function saveToJSON(invoices: any[]) {
  try {
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(invoices, null, 2), 'utf8');
  } catch (err) {
    console.error('[JSON DB] Error saving invoices:', err);
  }
}

// Intercept queries and provide file fallback
export const query = async (text: string, params?: any[]): Promise<any> => {
  const cleanText = text.trim().toUpperCase();

  // Helper for JSON storage logic
  const handleJsonStorage = () => {
    // Intercept SELECT
    if (cleanText.startsWith('SELECT')) {
      const invoices = loadFromJSON();
      // Sort by created_at desc (newest first)
      const sorted = invoices.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.date || 0).getTime();
        return dateB - dateA;
      });
      return { rows: sorted };
    }
    
    // Intercept INSERT / UPDATE (ON CONFLICT)
    if (cleanText.startsWith('INSERT')) {
      if (!params || params.length < 1) {
        throw new Error('INSERT parameters are missing in local DB fallback');
      }
      
      const invoices = loadFromJSON();
      const id = params[0];
      
      // Parse items safely if it is a JSON string
      let items = params[5];
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }

      const newRow = {
        id: id,
        invoice_number: params[1] || '',
        customer_name: params[2] || '',
        customer_email: params[3] || '',
        customer_phone: params[4] || '',
        items: items || [],
        subtotal: params[6] || 0,
        tax_amount: params[7] || 0,
        total: params[8] || 0,
        status: params[9] || 'draft',
        date: params[10] || new Date().toISOString(),
        due_date: params[11] || new Date().toISOString(),
        type: params[12] || 'invoice',
        payment_method: params[13] || 'Other',
        customer_company: params[14] || '',
        customer_notes: params[15] || '',
        created_at: new Date().toISOString()
      };

      const existingIndex = invoices.findIndex(inv => inv.id === id);
      if (existingIndex >= 0) {
        // Update
        invoices[existingIndex] = {
          ...invoices[existingIndex],
          ...newRow,
          created_at: invoices[existingIndex].created_at || newRow.created_at // retain original created_at
        };
      } else {
        // Insert
        invoices.push(newRow);
      }
      
      saveToJSON(invoices);
      return { rows: [newRow] };
    }
    
    // Intercept DELETE
    if (cleanText.startsWith('DELETE')) {
      if (!params || params.length < 1) {
        throw new Error('DELETE parameters are missing in local DB fallback');
      }
      const invoices = loadFromJSON();
      const id = params[0];
      const filtered = invoices.filter(inv => inv.id !== id);
      saveToJSON(filtered);
      return { rows: [{ id }] };
    }
    
    // Default fallback
    return { rows: [] };
  };

  if (!isValidDbUrl) {
    return handleJsonStorage();
  }

  try {
    // Try PostgreSQL if URL was configured
    return await pool.query(text, params);
  } catch (pgError: any) {
    return handleJsonStorage();
  }
};

export async function ensureInvoicesTable() {
  if (!isValidDbUrl) {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      saveToJSON([]);
    }
    return;
  }

  try {
    const schema = `
      CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL DEFAULT 'owner',
          invoice_number TEXT,
          customer_name TEXT,
          customer_email TEXT,
          customer_phone TEXT,
          items JSONB,
          subtotal DECIMAL(10, 2),
          tax_amount DECIMAL(10, 2),
          total DECIMAL(10, 2),
          status TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`;
    await pool.query(schema);

    const alters = [
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS date TEXT;",
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date TEXT;",
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type TEXT;",
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;",
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_company TEXT;",
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_notes TEXT;"
    ];
    for (const alter of alters) {
      try {
        await pool.query(alter);
      } catch (e) {
        console.warn("Failed to apply schema alter:", e);
      }
    }
  } catch (dbError: any) {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      saveToJSON([]);
    }
  }
}
