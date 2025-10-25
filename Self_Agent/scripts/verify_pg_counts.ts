import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const pool: any = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    console.log('--- documents by source ---');
    const docsBySource = await client.query(`SELECT COALESCE(source,'<null>') as source, COUNT(*)::int AS count
      FROM documents GROUP BY source ORDER BY count DESC`);
    console.table(docsBySource.rows);

    console.log('\n--- chunks count (wechat+instagram) ---');
    const chunksRes = await client.query(`SELECT COUNT(*)::int AS count
      FROM chunks c JOIN documents d ON d.id=c.doc_id WHERE d.source IN ('wechat','instagram')`);
    console.log(chunksRes.rows[0]);

    console.log('\n--- chunks with embedding (wechat+instagram) ---');
    const chunksEmb = await client.query(`SELECT COUNT(*)::int AS count
      FROM chunks c JOIN documents d ON d.id=c.doc_id WHERE d.source IN ('wechat','instagram') AND c.embedding IS NOT NULL`);
    console.log(chunksEmb.rows[0]);

    console.log('\n--- sample 3 documents (wechat/instagram) ---');
    const sampleDocs = await client.query(`SELECT id, user_id, source, title FROM documents 
      WHERE source IN ('wechat','instagram') LIMIT 3`);
    console.table(sampleDocs.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
