import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if tab exists and is published
  const tabResult = await query(
    'SELECT id, is_published FROM "guitar-tabs" WHERE id = $1',
    [id]
  );

  if (tabResult.rows.length === 0 || tabResult.rows[0].is_published !== true) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Get PDF from tab_files
  const result = await query(
    'SELECT filename, content_type, data FROM tab_files WHERE tab_id = $1 AND format = $2',
    [id, 'pdf']
  );

  console.log('Preview result:', {
    tabId: id,
    hasRows: result.rows.length > 0,
    rowCount: result.rows.length,
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'No PDF' }, { status: 404 });
  }

  const row = result.rows[0];
  return new NextResponse(row.data, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${row.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
