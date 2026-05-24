import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tabId: string; format: string }> }
) {
  const { tabId, format } = await params;

  // Get file from tab_files table
  const result = await query(
    'SELECT filename, content_type, data FROM tab_files WHERE tab_id = $1 AND format = $2',
    [tabId, format]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const row = result.rows[0];

  // Return file with correct content type
  return new NextResponse(row.data, {
    headers: {
      'Content-Type': row.content_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${row.filename}"`,
    },
  });
}
