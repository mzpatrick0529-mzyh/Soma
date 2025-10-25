import DatabaseConstructor from 'better-sqlite3';
import type { Database as SQLiteDatabase } from 'better-sqlite3';

export type Database = SQLiteDatabase;

let dbInstance: Database | null = null;

export function getDatabase(dbPath: string = './data/self_agent.db'): Database {
  if (!dbInstance) {
    dbInstance = new DatabaseConstructor(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    initializeSchema(dbInstance);
  }
  return dbInstance;
}

function initializeSchema(db: Database): void {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      timestamp INTEGER NOT NULL,
      source TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  \`);
}
