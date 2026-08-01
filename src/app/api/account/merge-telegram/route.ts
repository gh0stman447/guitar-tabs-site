import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hashToken } from '@/lib/customer-auth';
import { transaction } from '@/lib/db';

export async function POST(req: NextRequest) {
  const currentUser = await getUserFromRequest(req);
  const pendingToken = req.cookies.get('account_merge_pending')?.value;
  if (!currentUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    await transaction(async (client) => {
      const attemptResult = pendingToken
        ? await client.query(
          `SELECT id, target_user_id, source_user_id
           FROM account_merge_attempts
           WHERE token_hash = $1
             AND target_user_id = $2
             AND used_at IS NULL
             AND expires_at > now()
           FOR UPDATE`,
          [hashToken(pendingToken), currentUser.id],
        )
        : await client.query(
          `SELECT id, target_user_id, source_user_id
           FROM account_merge_attempts
           WHERE target_user_id = $1
             AND used_at IS NULL
             AND expires_at > now()
           ORDER BY created_at DESC
           LIMIT 1
           FOR UPDATE`,
          [currentUser.id],
        );
      const attempt = attemptResult.rows[0] as
        | { id: string; target_user_id: string; source_user_id: string }
        | undefined;
      if (!attempt || attempt.target_user_id !== currentUser.id) throw new Error('merge_expired');

      const sourceChainResult = await client.query(
        `WITH RECURSIVE source_chain AS (
           SELECT id, merged_into_user_id, ARRAY[id] AS visited
           FROM users WHERE id = $1
           UNION ALL
           SELECT parent.id, parent.merged_into_user_id, chain.visited || parent.id
           FROM source_chain chain
           JOIN users parent ON parent.id = chain.merged_into_user_id
           WHERE NOT parent.id = ANY(chain.visited)
         )
         SELECT id, merged_into_user_id FROM source_chain`,
        [attempt.source_user_id],
      );
      const sourceChain = sourceChainResult.rows as Array<{
        id: string;
        merged_into_user_id: string | null;
      }>;
      const canonicalSource = sourceChain.find((user) => user.merged_into_user_id === null)?.id;
      if (!canonicalSource) throw new Error('invalid_merge_chain');
      if (canonicalSource === attempt.target_user_id) {
        await client.query('UPDATE account_merge_attempts SET used_at = now() WHERE id = $1', [
          attempt.id,
        ]);
        return;
      }

      const sourceClusterResult = await client.query(
        `WITH RECURSIVE source_cluster AS (
           SELECT id FROM users WHERE id = $1
           UNION
           SELECT child.id
           FROM users child
           JOIN source_cluster cluster ON child.merged_into_user_id = cluster.id
         )
         SELECT id FROM source_cluster`,
        [canonicalSource],
      );
      const sourceUserIds = sourceClusterResult.rows.map((row) => row.id as string);
      if (sourceUserIds.includes(attempt.target_user_id)) throw new Error('invalid_merge_chain');

      await client.query(
        `SELECT id FROM users
         WHERE id = $1 OR id = ANY($2::uuid[])
         FOR UPDATE`,
        [attempt.target_user_id, sourceUserIds],
      );

      const targetTelegram = await client.query(
        `SELECT id FROM user_identities
         WHERE user_id = $1 AND provider = 'telegram' LIMIT 1`,
        [attempt.target_user_id],
      );
      if (targetTelegram.rowCount) throw new Error('target_has_telegram');

      await client.query('UPDATE customers SET user_id = $1 WHERE user_id = ANY($2::uuid[])', [
        attempt.target_user_id,
        sourceUserIds,
      ]);
      await client.query(
        `UPDATE user_identities SET user_id = $1, updated_at = now()
         WHERE user_id = ANY($2::uuid[]) AND provider = 'telegram'`,
        [attempt.target_user_id, sourceUserIds],
      );
      await client.query(
        `UPDATE users
         SET merged_into_user_id = $1, updated_at = now()
         WHERE id = ANY($2::uuid[])`,
        [attempt.target_user_id, sourceUserIds],
      );
      await client.query('DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])', [
        sourceUserIds,
      ]);
      await client.query('UPDATE account_merge_attempts SET used_at = now() WHERE id = $1', [
        attempt.id,
      ]);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'merge_failed';
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('account_merge_pending', '', { maxAge: 0, path: '/' });
  return response;
}
