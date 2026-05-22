import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';
import { TABLE_TABS } from '@/lib/constants';

// GET /api/admin/tabs - get tabs by status
// Query params: published=true | drafts=true | count=true | single=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('count') === 'true';
    const singleOnly = searchParams.get('single') === 'true';
    const published = searchParams.get('published') === 'true';
    const drafts = searchParams.get('drafts') === 'true';
    const order = searchParams.get('order') || 'created_at';
    const dir = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';

    let sql = `SELECT * FROM ${TABLE_TABS}`;
    const conditions: string[] = [];

    if (published) {
      conditions.push('is_published = true');
    } else if (drafts) {
      conditions.push('is_published = false');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (countOnly) {
      // Return just count
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
      const result = await dbQuery(countSql);
      return NextResponse.json({ count: parseInt(result.rows[0].count, 10) });
    }

    sql += ` ORDER BY ${order} ${dir}`;

    const result = await dbQuery(sql);

    if (singleOnly) {
      return NextResponse.json(result.rows[0] || null);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin tabs:', error);
    return NextResponse.json({ error: 'Failed to fetch tabs' }, { status: 500 });
  }
}
