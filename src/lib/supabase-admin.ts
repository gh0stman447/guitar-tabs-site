import db from './db';
import * as storage from './storage';

// Re-export db for backward compatibility
export { db };

// Storage API (mimicking Supabase storage interface)
export const supabaseAdmin = {
  from(table: string) {
    return db.from(table);
  },
  storage: {
    from(bucket: string) {
      // Bucket is ignored - we use flat file structure
      void bucket;
      return {
        upload: async (path: string, buffer: ArrayBuffer | Buffer, _options?: { contentType?: string; upsert?: boolean }) => {
          try {
            await storage.uploadFile(path, buffer);
            return { data: { path }, error: null };
          } catch (error: unknown) {
            return { data: null, error: error instanceof Error ? error : new Error('Upload failed') };
          }
        },
        download: async (path: string) => {
          try {
            const data = await storage.downloadFile(path);
            return { data, error: null };
          } catch (error: unknown) {
            return { data: null, error: error instanceof Error ? error : new Error('Download failed') };
          }
        },
        remove: async (paths: string[]) => {
          try {
            await storage.deleteFiles(paths);
            return { data: null, error: null };
          } catch (error: unknown) {
            return { data: null, error: error instanceof Error ? error : new Error('Delete failed') };
          }
        },
        list: async (folder: string, options?: { search?: string }) => {
          try {
            const data = await storage.listFiles(folder, options);
            return { data, error: null };
          } catch (error: unknown) {
            return { data: null, error: error instanceof Error ? error : new Error('List failed') };
          }
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: storage.getPublicUrl(path) } };
        },
      };
    },
  },
};
