import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';
import { TABLE_TABS } from '@/lib/constants';

// Quote table name if it contains hyphen
const TABLE_TABS_QUOTED = `"${TABLE_TABS}"`;

// GET /api/tabs - get all published tabs
// Query params: published=true | count=true | single=true | order=field | dir=asc|desc | limit=N
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyPublished = searchParams.get('published') === 'true';
    const countOnly = searchParams.get('count') === 'true';
    const singleOnly = searchParams.get('single') === 'true';
    const order = searchParams.get('order') || 'purchase_count';
    const dir = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';
    const limit = searchParams.get('limit');

    let sql = `SELECT * FROM ${TABLE_TABS_QUOTED}`;
    if (onlyPublished) {
      sql += ' WHERE is_published = true';
    }

    if (countOnly) {
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
      const result = await dbQuery(countSql);
      return NextResponse.json({ count: parseInt(result.rows[0].count, 10) });
    }

    sql += ` ORDER BY ${order} ${dir}`;
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const result = await dbQuery(sql);

    if (singleOnly) {
      return NextResponse.json(result.rows[0] || null);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tabs' }, { status: 500 });
  }
}
