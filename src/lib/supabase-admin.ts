import db from './db';

// Re-export db for backward compatibility
export { db };

// Database API
export const supabaseAdmin = {
  from(table: string) {
    return db.from(table);
  },
};
