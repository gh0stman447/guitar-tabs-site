import { query } from './db';

/**
 * Upload a file to PostgreSQL bytea storage
 * @param key - File path like 'tab-abc123/file.pdf'
 * @param buffer - File content as ArrayBuffer or Buffer
 * @param contentType - MIME type
 */
export async function uploadFile(
  key: string,
  buffer: ArrayBuffer | Buffer,
  contentType?: string
) {
  // Parse key: 'tab-id/filename.ext' -> tabId, format, filename
  const parts = key.split('/');
  const tabId = parts[0];
  const filename = parts[1];
  const ext = filename.split('.').pop()?.toLowerCase();

  // Determine format from extension
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

  const bufferToUse = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // Upsert into tab_files table
  await query(
    `INSERT INTO tab_files (tab_id, format, filename, content_type, data)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tab_id, format) DO UPDATE SET
       filename = EXCLUDED.filename,
       content_type = EXCLUDED.content_type,
       data = EXCLUDED.data`,
    [tabId, format, filename, contentType || 'application/octet-stream', bufferToUse]
  );

  return { path: key };
}

/**
 * Download a file from PostgreSQL bytea storage
 * @param key - File path like 'tab-abc123/file.pdf'
 * @returns File content as Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
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

  const result = await query(
    'SELECT data FROM tab_files WHERE tab_id = $1 AND format = $2',
    [tabId, format]
  );

  if (result.rows.length === 0) {
    throw new Error(`File not found: ${key}`);
  }

  return result.rows[0].data;
}

/**
 * Delete a file from PostgreSQL bytea storage
 * @param key - File path like 'tab-abc123/file.pdf'
 */
export async function deleteFile(key: string) {
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

  await query('DELETE FROM tab_files WHERE tab_id = $1 AND format = $2', [tabId, format]);
}

/**
 * Delete multiple files from PostgreSQL bytea storage
 * @param keys - Array of file paths
 */
export async function deleteFiles(keys: string[]) {
  await Promise.all(keys.map(key => deleteFile(key)));
}

/**
 * List files for a tab from PostgreSQL bytea storage
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

  let files = result.rows.map((f: { format: string; filename: string }) => ({
    name: f.filename,
    path: `${folder}/${f.filename}`,
    format: f.format,
  }));

  if (options?.search) {
    files = files.filter(f => f.name.includes(options.search!));
  }

  return files;
}

/**
 * Get public URL for a file (serves via API endpoint)
 * @param key - File path like 'tab-abc123/file.pdf'
 * @returns API endpoint URL (relative path)
 */
export function getPublicUrl(key: string): string {
  // Parse key: 'tab-id/filename.ext' -> extract format
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

  // Return relative path for next/image compatibility
  return `/api/files/${tabId}/${format}`;
}

/**
 * Check if file exists in PostgreSQL bytea storage
 * @param key - File path like 'tab-abc123/file.pdf'
 */
export async function fileExists(key: string): Promise<boolean> {
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

  const result = await query(
    'SELECT 1 FROM tab_files WHERE tab_id = $1 AND format = $2 LIMIT 1',
    [tabId, format]
  );

  return result.rows.length > 0;
}
