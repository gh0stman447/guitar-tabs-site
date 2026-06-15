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
 * Upload a file to filesystem storage
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

  // MP3 files go to filesystem, others to database (bytea)
  if (format === 'mp3') {
    const filePath = getFilePath(tabId);
    console.log(`[storage] Writing MP3 to filesystem: ${filePath}`);
    await fs.promises.mkdir(AUDIO_DIR, { recursive: true });
    await fs.promises.writeFile(filePath, bufferToUse);

    await query(
      `INSERT INTO tab_files (tab_id, format, filename, content_type, data)
       VALUES ($1, $2, $3, $4, NULL)
       ON CONFLICT (tab_id, format) DO UPDATE SET
         filename = EXCLUDED.filename,
         content_type = EXCLUDED.content_type,
         data = NULL`,
      [tabId, format, `${tabId}.mp3`, contentType || 'audio/mpeg']
    );
  } else {
    // Store in database as bytea
    console.log(`[storage] Storing ${format} in database (bytea)`);
    await query(
      `INSERT INTO tab_files (tab_id, format, filename, content_type, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tab_id, format) DO UPDATE SET
         filename = EXCLUDED.filename,
         content_type = EXCLUDED.content_type,
         data = EXCLUDED.data`,
      [tabId, format, filename, contentType || 'application/octet-stream', bufferToUse]
    );
  }

  console.log(`[storage] Upload complete: ${key}`);
  return { path: key };
}

/**
 * Download a file (MP3 from filesystem, others from database)
 * @param key - File path like 'tab-id/filename.ext'
 * @returns File content as Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const { tabId, filename, format } = parseKey(key);

  // MP3 from filesystem, others from database
  if (format === 'mp3') {
    const filePath = getFilePath(tabId);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }
    return await fs.promises.readFile(filePath);
  } else {
    // Read from database bytea
    const result = await query('SELECT data FROM tab_files WHERE tab_id = $1 AND format = $2', [tabId, format]);
    if (result.rows.length === 0) {
      throw new Error(`File not found in database: ${key}`);
    }
    const row = result.rows[0];
    if (!row.data) {
      throw new Error(`File data is null: ${key}`);
    }
    return Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data, 'hex');
  }
}

/**
 * Delete a file (MP3 from filesystem, others from database)
 * @param key - File path like 'tab-id/filename.ext'
 */
export async function deleteFile(key: string) {
  const { tabId, filename, format } = parseKey(key);

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
 * Check if file exists (MP3 in filesystem, others in database)
 * @param key - File path like 'tab-id/filename.ext'
 */
export async function fileExists(key: string): Promise<boolean> {
  const { tabId, format } = parseKey(key);

  if (format === 'mp3') {
    const filePath = getFilePath(tabId);
    return fs.existsSync(filePath);
  } else {
    const result = await query('SELECT 1 FROM tab_files WHERE tab_id = $1 AND format = $2 AND data IS NOT NULL', [tabId, format]);
    return result.rows.length > 0;
  }
}
