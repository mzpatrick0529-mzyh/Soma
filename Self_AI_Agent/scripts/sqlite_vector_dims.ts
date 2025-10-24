import Database from 'better-sqlite3';

const db = new Database('./self_agent.db');

function dimsBySource(sources: string[]) {
  const placeholders = sources.map(() => '?').join(',');
  const sql = `SELECT d.source as source, v.dim as dim, COUNT(*) as c
               FROM vectors v 
               JOIN chunks c ON c.id = v.chunk_id
               JOIN documents d ON d.id = c.doc_id
               WHERE d.source IN (${placeholders})
               GROUP BY d.source, v.dim
               ORDER BY d.source, v.dim`;
  const rows = db.prepare(sql).all(...sources);
  console.table(rows);
}

console.log('Dims for instagram, google, chrome, search:');
// You can add other sources here if needed
dimsBySource(['instagram','google','chrome','search']);

db.close();
