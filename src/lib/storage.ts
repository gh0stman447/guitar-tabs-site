import { promises as fs } from 'fs';
import path from 'path';

// Storage directory on VPS
const STORAGE_ROOT = process.env.STORAGE_ROOT || '/var/www/guitar-tabs/storage';

// Ensure storage directory exists
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Upload a file to storage
 * @param key - File path relative to storage root (e.g., 'tab-abc123/file.pdf')
 * @param buffer - File content as ArrayBuffer or Buffer
 * @param contentType - MIME type
 */
export async function uploadFile(
  key: string,
  buffer: ArrayBuffer | Buffer
) {
  const filePath = path.join(STORAGE_ROOT, key);
  await ensureDir(path.dirname(filePath));

  const bufferToUse = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await fs.writeFile(filePath, bufferToUse);

  return { path: key };
}

/**
 * Download a file from storage
 * @param key - File path relative to storage root
 * @returns File content as Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const filePath = path.join(STORAGE_ROOT, key);
  return fs.readFile(filePath);
}

/**
 * Delete a file from storage
 * @param key - File path relative to storage root
 */
export async function deleteFile(key: string) {
  const filePath = path.join(STORAGE_ROOT, key);
  try {
    await fs.unlink(filePath);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') throw error;
  }
}

/**
 * Delete multiple files from storage
 * @param keys - Array of file paths
 */
export async function deleteFiles(keys: string[]) {
  await Promise.all(keys.map(key => deleteFile(key)));
}

/**
 * List files in a directory
 * @param folder - Folder path relative to storage root
 * @param options - Optional search filter
 * @returns Array of file info objects
 */
export async function listFiles(
  folder: string,
  options?: { search?: string }
) {
  const dirPath = path.join(STORAGE_ROOT, folder);

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files = entries
      .filter(d => d.isFile())
      .map(f => ({
        name: f.name,
        path: `${folder}/${f.name}`,
      }));

    if (options?.search) {
      files = files.filter(f => f.name.includes(options.search!));
    }

    return files;
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Get public URL for a file
 * @param key - File path relative to storage root
 * @returns Public URL
 */
export function getPublicUrl(key: string): string {
  const baseUrl = process.env.STORAGE_URL || 'https://olegguitar.com/storage';
  return `${baseUrl}/${key}`;
}

/**
 * Check if file exists
 * @param key - File path relative to storage root
 */
export async function fileExists(key: string): Promise<boolean> {
  const filePath = path.join(STORAGE_ROOT, key);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
