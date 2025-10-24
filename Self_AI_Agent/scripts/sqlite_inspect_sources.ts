import Database from 'better-sqlite3';

const dbPath = process.argv[2] || './self_agent.db';
const db = new Database(dbPath);

const rows = db.prepare("SELECT COALESCE(source,'<null>') as source, COUNT(*) as c FROM documents GROUP BY source ORDER BY c DESC").all();
console.table(rows);

db.close();
