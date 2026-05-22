import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';
import { TABLE_PURCHASES } from '@/lib/constants';

// GET /api/purchases/[id] - get purchase by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await dbQuery(
      `SELECT * FROM ${TABLE_PURCHASES} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase' }, { status: 500 });
  }
}
