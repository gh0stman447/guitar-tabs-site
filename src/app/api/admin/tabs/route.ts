import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';
import { TABLE_TABS } from '@/lib/constants';

// Quote table name if it contains hyphen
const TABLE_TABS_QUOTED = `"${TABLE_TABS}"`;

// GET /api/admin/tabs - get tabs by status
// Query params: published=true | drafts=true | count=true | single=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('count') === 'true';
    const singleOnly = searchParams.get('single') === 'true';
    const id = searchParams.get('id');
    const published = searchParams.get('published') === 'true';
    const drafts = searchParams.get('drafts') === 'true';
    const order = searchParams.get('order') || 'created_at';
    const dir = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (id) {
      conditions.push(`tabs.id = $${paramIndex++}`);
      values.push(id);
    }
    if (published) {
      conditions.push('tabs.is_published = true');
    } else if (drafts) {
      conditions.push('tabs.is_published = false');
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

    if (countOnly) {
      const countSql = `SELECT COUNT(*) FROM ${TABLE_TABS_QUOTED} AS tabs${whereClause}`;
      const result = await dbQuery(countSql, values);
      return NextResponse.json({ count: parseInt(result.rows[0].count, 10) });
    }

    let sql = `
      SELECT
        tabs.*,
        (
          SELECT COUNT(*)::int
          FROM tab_downloads AS downloads
          WHERE downloads.tab_id = tabs.id
        ) AS download_count
      FROM ${TABLE_TABS_QUOTED} AS tabs
      ${whereClause}
    `;

    sql += ` ORDER BY ${order} ${dir}`;

    const result = await dbQuery(sql, values);

    if (singleOnly) {
      return NextResponse.json(result.rows[0] || null);
    }

    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tabs' }, { status: 500 });
  }
}
