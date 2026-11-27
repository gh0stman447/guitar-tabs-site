import { Pool, PoolClient, QueryResult } from 'pg';

const connectionString = process.env.DATABASE_URL?.trim();
// pg does not map the connection_limit URL parameter to its pool size.
const connectionLimit = connectionString
  ? new URL(connectionString).searchParams.get('connection_limit')
  : null;
const maxConnections = connectionLimit === null ? 20 : Number(connectionLimit);
if (!Number.isSafeInteger(maxConnections) || maxConnections < 1) {
  throw new Error('DATABASE_URL connection_limit must be a positive integer');
}

// PostgreSQL connection pool with increased timeouts for remote connections
const pool = new Pool({
  ...(connectionString
    ? { connectionString }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'guitar_tabs',
        user: process.env.DB_USER || 'guitar',
        password: process.env.DB_PASSWORD,
      }),
  max: maxConnections,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
  // Keep connections alive for remote DB
  keepAlive: true,
  // Retry initial connection
  maxUses: 100,
});

// Helper to execute queries with retry logic
export async function query(sql: string, values?: unknown[], retryCount = 0): Promise<QueryResult> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, values);
    return result;
  } catch (error) {
    // Retry on connection errors up to 3 times
    if (retryCount < 3 && (error as Error).message.includes('Connection')) {
      client.release();
      await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)));
      return query(sql, values, retryCount + 1);
    }
    throw error;
  } finally {
    client.release();
  }
}

// Helper for transactions
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
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
    // Quote table name if it contains special characters (e.g., "guitar-tabs")
    const quotedTable = table.includes('-') ? `"${table}"` : table;

    return {
      select(fields: string = '*') {
        // Quote field names that contain underscores or are not wildcards
        if (fields !== '*') {
          const quotedFields = fields
            .split(',')
            .map((f) => f.trim())
            .map((f) => (f.includes('_') || f.includes('-') ? `"${f}"` : f))
            .join(', ');
          selectedFields = quotedFields;
        } else {
          selectedFields = '*';
        }
        return {
          where: async (condition: string, values: unknown[] = []) => {
            const result = await query(
              `SELECT ${selectedFields} FROM ${quotedTable} WHERE ${condition}`,
              values,
            );
            return { data: result.rows, error: null };
          },
          in: (column: string, values: unknown[]) => {
            return {
              then: async (resolve: (value: { data: unknown[]; error: null }) => void) => {
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                const result = await query(
                  `SELECT ${selectedFields} FROM ${quotedTable} WHERE "${column}" IN (${placeholders})`,
                  values,
                );
                resolve({ data: result.rows, error: null });
              },
            };
          },
          eq: (column: string, value: unknown) => {
            return {
              single: async () => {
                const result = await query(
                  `SELECT ${selectedFields} FROM ${quotedTable} WHERE "${column}" = $1 LIMIT 1`,
                  [value],
                );
                return { data: result.rows[0] || null, error: null };
              },
              then: async (resolve: (value: { data: unknown[]; error: null }) => void) => {
                const result = await query(
                  `SELECT ${selectedFields} FROM ${quotedTable} WHERE "${column}" = $1`,
                  [value],
                );
                resolve({ data: result.rows, error: null });
              },
            };
          },
          single: async () => {
            const result = await query(`SELECT ${selectedFields} FROM ${quotedTable} LIMIT 1`);
            return { data: result.rows[0] || null, error: null };
          },
          all: async () => {
            const result = await query(`SELECT ${selectedFields} FROM ${quotedTable}`);
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
                  const updateClause = keys
                    .filter((k) => k !== conflictColumn)
                    .map((k) => `${k} = EXCLUDED.${k}`)
                    .join(', ');
                  const result = await query(
                    `INSERT INTO ${quotedTable} (${keys.map((k) => (k.includes('-') ? `"${k}"` : k)).join(', ')}) VALUES (${placeholders}) ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateClause} RETURNING ${fields}`,
                    values,
                  );
                  return { data: result.rows[0], error: null };
                } catch (err) {
                  return {
                    data: null,
                    error: err instanceof Error ? err : new Error('Upsert failed'),
                  };
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
                    `INSERT INTO ${quotedTable} (${keys.map((k) => (k.includes('-') ? `"${k}"` : k)).join(', ')}) VALUES (${placeholders}) RETURNING ${fields}`,
                    values,
                  );
                  return { data: result.rows[0], error: null };
                } catch (err) {
                  return {
                    data: null,
                    error: err instanceof Error ? err : new Error('Insert failed'),
                  };
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
              // Quote column names in SET clause to handle underscores and reserved words
              const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
              const result = await query(
                `UPDATE ${quotedTable} SET ${setClause} WHERE "${column}" = $${keys.length + 1} RETURNING *`,
                values,
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
              await query(`DELETE FROM ${quotedTable} WHERE ${column} = $1`, [value]);
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
