import { query } from './db';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

/**
 * Parse file key to extract tabId and format
 * @param key - File path like 'tab-id/filename.ext'
 */
function parseKey(key: string): { tabId: string; filename: string; format: string } {
  const parts = key.split('/');
  const tabId = parts[0];
  const filename = parts[1];
  const ext = filename.split('.').pop()?.toLowerCase();

  const formatMap: Record<string, string> = {
    'pdf': 'pdf',
    'gp3': 'gp5',
    'gp4': 'gp5',
    'gp5': 'gp5',
    'gpx': 'gpx',
    'mp3': 'mp3',
    'jpg': 'photo',
    'jpeg': 'photo',
    'png': 'photo',
    'webp': 'photo',
  };
  const format = formatMap[ext || ''] || 'other';

  return { tabId, filename, format };
}

/**
 * Get file path in filesystem (MP3 only)
 */
function getFilePath(tabId: string): string {
  return path.join(AUDIO_DIR, `${tabId}.mp3`);
}

/**
 * Upload a file to PostgreSQL
 * @param key - File path like 'tab-id/filename.ext'
 * @param buffer - File content as ArrayBuffer or Buffer
 * @param contentType - MIME type
 */
export async function uploadFile(
  key: string,
  buffer: ArrayBuffer | Buffer,
  contentType?: string
) {
  const { tabId, filename, format } = parseKey(key);
  const bufferToUse = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // Store every new upload in PostgreSQL so it survives redeploys.
  await query(
    `INSERT INTO tab_files (tab_id, format, filename, content_type, data)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tab_id, format) DO UPDATE SET
       filename = EXCLUDED.filename,
       content_type = EXCLUDED.content_type,
       data = EXCLUDED.data`,
    [tabId, format, filename, contentType || 'application/octet-stream', bufferToUse],
  );

  console.log(`[storage] Upload complete: ${key}`);
  return { path: key };
}

/**
 * Download a file from PostgreSQL, falling back to legacy local MP3
 * @param key - File path like 'tab-id/filename.ext'
 * @returns File content as Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const { tabId, format } = parseKey(key);
  const result = await query('SELECT data FROM tab_files WHERE tab_id = $1 AND format = $2', [tabId, format]);
  const data = result.rows[0]?.data;
  if (data) {
    return Buffer.isBuffer(data) ? data : Buffer.from(data.replace(/^\\x/, ''), 'hex');
  }
  // Compatibility with MP3 uploaded before database storage was introduced.
  if (format === 'mp3' && result.rows.length > 0) {
    return fs.promises.readFile(getFilePath(tabId));
  }
  throw new Error(`File not found in database: ${key}`);
}

/**
 * Delete a file (MP3 from filesystem, others from database)
 * @param key - File path like 'tab-id/filename.ext'
 */
export async function deleteFile(key: string) {
  const { tabId, format } = parseKey(key);

  // Delete MP3 from filesystem, others just from database
  if (format === 'mp3') {
    const filePath = getFilePath(tabId);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  // Delete metadata from table
  await query('DELETE FROM tab_files WHERE tab_id = $1 AND format = $2', [tabId, format]);
}

/**
 * Delete multiple files from filesystem storage
 * @param keys - Array of file paths
 */
export async function deleteFiles(keys: string[]) {
  await Promise.all(keys.map(key => deleteFile(key)));
}

/**
 * List files for a tab from database
 * @param folder - Tab ID
 * @param options - Optional search filter
 * @returns Array of file info objects
 */
export async function listFiles(
  folder: string,
  options?: { search?: string }
) {
  const result = await query(
    'SELECT format, filename FROM tab_files WHERE tab_id = $1',
    [folder]
  );

  let files = result.rows.map((row: { format: string; filename: string }) => ({
    name: row.filename,
    path: `${folder}/${row.filename}`,
    format: row.format,
  }));

  if (options?.search) {
    files = files.filter(f => f.name.includes(options.search!));
  }

  return files;
}

/**
 * Get public URL for a file
 * @param key - File path like 'tab-id/filename.ext'
 * @returns API endpoint URL (relative path)
 */
export function getPublicUrl(key: string): string {
  const { tabId, format } = parseKey(key);
  return `/api/files/${tabId}/${format}`;
}

/**
 * Check for database content or a legacy local MP3
 * @param key - File path like 'tab-id/filename.ext'
 */
export async function fileExists(key: string): Promise<boolean> {
  const { tabId, format } = parseKey(key);

  const result = await query('SELECT data IS NOT NULL AS has_data FROM tab_files WHERE tab_id = $1 AND format = $2', [tabId, format]);
  return result.rows[0]?.has_data === true ||
    (format === 'mp3' && result.rows.length > 0 && fs.existsSync(getFilePath(tabId)));
}
