import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!user.emailVerified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
  }

  const result = await query(
    `SELECT p.id, p.created_at, p.amount, p.tab_ids, p.tab_id,
            COALESCE(
              jsonb_agg(
                DISTINCT jsonb_build_object(
                  'id', t.id,
                  'title_ru', t.title_ru,
                  'title_en', t.title_en,
                  'photo_url', t.photo_url
                )
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'::jsonb
            ) AS tabs
     FROM purchases p
     JOIN customers c ON c.id = p.customer_id
     LEFT JOIN LATERAL jsonb_array_elements_text(
       CASE
         WHEN p.tab_ids IS NOT NULL THEN p.tab_ids
         WHEN p.tab_id IS NOT NULL THEN jsonb_build_array(p.tab_id)
         ELSE '[]'::jsonb
       END
     ) purchased_tab(id) ON true
     LEFT JOIN "guitar-tabs" t ON t.id::text = purchased_tab.id
     WHERE c.user_id = $1 AND p.status = 'succeeded'
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [user.id],
  );

  return NextResponse.json({ purchases: result.rows });
}
