import { Pool, QueryResult } from 'pg';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'guitar_tabs',
  user: process.env.DB_USER || 'guitar',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Helper to execute queries
export async function query(sql: string, values?: unknown[]): Promise<QueryResult> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, values);
    return result;
  } finally {
    client.release();
  }
}

// Helper for transactions
export async function transaction<T>(fn: (client: unknown) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Table helpers (mimicking Supabase-like API for easier migration)
export const db = {
  from(table: string) {
    let selectedFields = '*';

    return {
      select(fields: string = '*') {
        selectedFields = fields;
        return {
          where: async (condition: string, values: unknown[] = []) => {
            const result = await query(`SELECT ${selectedFields} FROM ${table} WHERE ${condition}`, values);
            return { data: result.rows, error: null };
          },
          in: (column: string, values: unknown[]) => {
            return {
              then: async (resolve: (value: { data: unknown[]; error: null }) => void) => {
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                const result = await query(
                  `SELECT ${selectedFields} FROM ${table} WHERE ${column} IN (${placeholders})`,
                  values
                );
                resolve({ data: result.rows, error: null });
              },
            };
          },
          eq: (column: string, value: unknown) => {
            return {
              single: async () => {
                const result = await query(
                  `SELECT ${selectedFields} FROM ${table} WHERE ${column} = $1 LIMIT 1`,
                  [value]
                );
                return { data: result.rows[0] || null, error: null };
              },
              then: async (resolve: (value: { data: unknown[]; error: null }) => void) => {
                const result = await query(
                  `SELECT ${selectedFields} FROM ${table} WHERE ${column} = $1`,
                  [value]
                );
                resolve({ data: result.rows, error: null });
              },
            };
          },
          single: async () => {
            const result = await query(`SELECT ${selectedFields} FROM ${table} LIMIT 1`);
            return { data: result.rows[0] || null, error: null };
          },
          all: async () => {
            const result = await query(`SELECT ${selectedFields} FROM ${table}`);
            return { data: result.rows, error: null };
          },
        };
      },
      upsert(row: Record<string, unknown>, options?: { onConflict?: string }) {
        return {
          select: (fields: string = '*') => {
            return {
              single: async () => {
                try {
                  const keys = Object.keys(row);
                  const values = Object.values(row);
                  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                  const conflictColumn = options?.onConflict || keys[0];
                  const updateClause = keys.filter(k => k !== conflictColumn).map(k => `${k} = EXCLUDED.${k}`).join(', ');
                  const result = await query(
                    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateClause} RETURNING ${fields}`,
                    values
                  );
                  return { data: result.rows[0], error: null };
                } catch (err) {
                  return { data: null, error: err instanceof Error ? err : new Error('Upsert failed') };
                }
              },
            };
          },
        };
      },
      insert(row: Record<string, unknown>) {
        return {
          select: (fields: string = '*') => {
            return {
              single: async () => {
                try {
                  const keys = Object.keys(row);
                  const values = Object.values(row);
                  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                  const result = await query(
                    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${fields}`,
                    values
                  );
                  return { data: result.rows[0], error: null };
                } catch (err) {
                  return { data: null, error: err instanceof Error ? err : new Error('Insert failed') };
                }
              },
            };
          },
        };
      },
      update(data: Record<string, unknown>) {
        return {
          eq: async (column: string, value: unknown) => {
            try {
              const keys = Object.keys(data);
              const values = [...Object.values(data), value];
              const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
              const result = await query(
                `UPDATE ${table} SET ${setClause} WHERE ${column} = $${keys.length + 1} RETURNING *`,
                values
              );
              return { data: result.rows[0], error: null };
            } catch (err) {
              return { data: null, error: err instanceof Error ? err : new Error('Update failed') };
            }
          },
        };
      },
      delete() {
        return {
          eq: async (column: string, value: unknown) => {
            try {
              await query(`DELETE FROM ${table} WHERE ${column} = $1`, [value]);
              return { error: null };
            } catch (err) {
              return { error: err instanceof Error ? err : new Error('Delete failed') };
            }
          },
        };
      },
    };
  },
};

export default db;
