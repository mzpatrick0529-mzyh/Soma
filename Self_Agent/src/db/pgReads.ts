import 'dotenv/config';
import { withUserClient } from './pgClient';

export async function findDuplicateDocByContentPg(
  userId: string,
  content: string,
  source?: string | null,
  type?: string | null
): Promise<string | null> {
  return withUserClient(userId, async (c) => {
    const r = await c.query(
      `SELECT id
       FROM documents
       WHERE user_id = $1
         AND md5(COALESCE(content, '')) = md5($2)
         AND COALESCE(source,'') = COALESCE($3,'')
         AND COALESCE(type,'') = COALESCE($4,'')
       LIMIT 1`,
      [userId, content, source ?? null, type ?? null]
    );
    return (r.rows?.[0]?.id as string | undefined) ?? null;
  });
}

export async function findDuplicateDocByMediaHashPg(
  userId: string,
  mediaSha256: string
): Promise<string | null> {
  return withUserClient(userId, async (c) => {
    const r = await c.query(
      `SELECT id
       FROM documents
       WHERE user_id = $1
         AND (metadata->>'media_sha256') = $2
       LIMIT 1`,
      [userId, mediaSha256]
    );
    return (r.rows?.[0]?.id as string | undefined) ?? null;
  });
}
