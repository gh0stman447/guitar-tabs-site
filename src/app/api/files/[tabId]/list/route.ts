import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tabId: string }> }
) {
  const { tabId } = await params;

  const result = await query(
    'SELECT format, filename FROM tab_files WHERE tab_id = $1',
    [tabId]
  );

  return NextResponse.json(result.rows);
}
