import Database from "better-sqlite3";

export type DBConfig = {
  filename?: string;
};

let db: Database.Database | null = null;

export function getDB(cfg: DBConfig = {}): Database.Database {
  if (db) return db;
  const filename = cfg.filename || process.env.SELF_AGENT_DB || 
    (process.env.NODE_ENV === "test" ? ":memory:" : "./self_agent.db");
  db = new Database(filename);
  db.pragma("journal_mode = WAL");

  // Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER
    );

    -- App auth users (email as primary id)
    CREATE TABLE IF NOT EXISTS auth_users (
      email TEXT PRIMARY KEY,
      name TEXT,
      username TEXT,
      avatar TEXT,
      password_hash TEXT,
      password_salt TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT,
      type TEXT,
      title TEXT,
      content TEXT,
      metadata TEXT,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      idx INTEGER,
      text TEXT,
      metadata TEXT,
      created_at INTEGER,
      FOREIGN KEY(doc_id) REFERENCES documents(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vectors (
      chunk_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dim INTEGER NOT NULL,
      vec BLOB NOT NULL,
      FOREIGN KEY(chunk_id) REFERENCES chunks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_user ON chunks(user_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
    CREATE INDEX IF NOT EXISTS idx_vectors_user ON vectors(user_id);

    -- User-specific AI models
    CREATE TABLE IF NOT EXISTS user_models (
      user_id TEXT PRIMARY KEY,
      model_id TEXT NOT NULL,
      version TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_models_user ON user_models(user_id);

    -- Personality training tables
    CREATE TABLE IF NOT EXISTS personality_training_samples (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      conversation_context TEXT,
      user_response TEXT,
      target_person TEXT,
      timestamp_context INTEGER,
      emotional_context TEXT,
      source_doc_id TEXT,
      quality_score REAL,
      used_for_training INTEGER DEFAULT 0,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(source_doc_id) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS personality_models (
      user_id TEXT PRIMARY KEY,
      model_version INTEGER NOT NULL,
      model_type TEXT DEFAULT 'lora',
      model_path TEXT,
      training_samples_count INTEGER,
      training_duration_seconds REAL,
      training_loss REAL,
      is_active INTEGER DEFAULT 1,
      hyperparameters TEXT,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS training_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      started_at INTEGER,
      finished_at INTEGER,
      error_message TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_training_samples_user 
      ON personality_training_samples(user_id);
    CREATE INDEX IF NOT EXISTS idx_training_samples_unused 
      ON personality_training_samples(user_id, used_for_training);
    CREATE INDEX IF NOT EXISTS idx_training_jobs_user 
      ON training_jobs(user_id);
  `);

  console.log("✅ Database schema initialized with personality tables");
  return db;
}

export function ensureUser(userId: string) {
  const db = getDB();
  const row = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!row) {
    db.prepare("INSERT INTO users(id, created_at) VALUES(?, ?)").run(userId, Date.now());
  }
}

export type AuthUser = {
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
};

export function getAuthUser(email: string): AuthUser | undefined {
  const db = getDB();
  return db.prepare("SELECT * FROM auth_users WHERE email = ?").get(email) as AuthUser | undefined;
}

export function upsertAuthUser(user: Partial<AuthUser> & { email: string }) {
  const db = getDB();
  const now = Date.now();
  db.prepare(
    `INSERT INTO auth_users(email, name, username, avatar, password_hash, password_salt, created_at)
     VALUES(@email, @name, @username, @avatar, @password_hash, @password_salt, @created_at)
     ON CONFLICT(email) DO UPDATE SET
       name=COALESCE(excluded.name, auth_users.name),
       username=COALESCE(excluded.username, auth_users.username),
       avatar=COALESCE(excluded.avatar, auth_users.avatar),
       password_hash=COALESCE(excluded.password_hash, auth_users.password_hash),
       password_salt=COALESCE(excluded.password_salt, auth_users.password_salt)
    `
  ).run({
    email: user.email,
    name: user.name ?? null,
    username: user.username ?? null,
    avatar: user.avatar ?? null,
    password_hash: user.password_hash ?? null,
    password_salt: user.password_salt ?? null,
    created_at: now,
  });
  ensureUser(user.email); // ensure RAG user exists
}

export function updateAuthProfile(email: string, patch: Partial<Pick<AuthUser, "name" | "username" | "avatar">>) {
  const db = getDB();
  db.prepare(
    `UPDATE auth_users SET
      name=COALESCE(@name, name),
      username=COALESCE(@username, username),
      avatar=COALESCE(@avatar, avatar)
     WHERE email=@email`
  ).run({ email, ...patch });
}

export type DocRecord = {
  id: string;
  user_id: string;
  source?: string;
  type?: string;
  title?: string;
  content?: string;
  metadata?: any;
  created_at?: number;
};

export function insertDocument(doc: DocRecord) {
  const db = getDB();
  db.prepare(
    `INSERT OR REPLACE INTO documents(id, user_id, source, type, title, content, metadata, created_at)
     VALUES(@id, @user_id, @source, @type, @title, @content, @metadata, @created_at)`
  ).run({ ...doc, metadata: doc.metadata ? JSON.stringify(doc.metadata) : null, created_at: doc.created_at || Date.now() });
}

export type ChunkRecord = {
  id: string;
  doc_id: string;
  user_id: string;
  idx: number;
  text: string;
  metadata?: any;
  created_at?: number;
};

export function insertChunk(ch: ChunkRecord) {
  const db = getDB();
  db.prepare(
    `INSERT OR REPLACE INTO chunks(id, doc_id, user_id, idx, text, metadata, created_at)
     VALUES(@id, @doc_id, @user_id, @idx, @text, @metadata, @created_at)`
  ).run({ ...ch, metadata: ch.metadata ? JSON.stringify(ch.metadata) : null, created_at: ch.created_at || Date.now() });
}

export function insertVector(chunkId: string, userId: string, vec: number[]) {
  const db = getDB();
  const dim = vec.length;
  // store as Float32Array buffer
  const buf = Buffer.from(new Float32Array(vec).buffer);
  db.prepare("INSERT OR REPLACE INTO vectors(chunk_id, user_id, dim, vec) VALUES(?, ?, ?, ?)")
    .run(chunkId, userId, dim, buf);
}

export function getChunksByUser(userId: string) {
  const db = getDB();
  const rows = db.prepare("SELECT * FROM chunks WHERE user_id = ? ORDER BY created_at ASC").all(userId) as any[];
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

export function getVectorsByUser(userId: string) {
  const db = getDB();
  return db.prepare("SELECT chunk_id, dim, vec FROM vectors WHERE user_id = ?").all(userId) as { chunk_id: string, dim: number, vec: Buffer }[];
}

export function countVectorsByUser(userId: string) {
  const db = getDB();
  const row = db.prepare("SELECT COUNT(*) AS count FROM vectors WHERE user_id = ?").get(userId) as { count: number } | undefined;
  return row?.count ?? 0;
}

export function getChunkText(chunkId: string) {
  const db = getDB();
  const row = db.prepare("SELECT text FROM chunks WHERE id = ?").get(chunkId) as { text: string } | undefined;
  return row?.text || "";
}

export function getChunkWithDoc(chunkId: string) {
  const db = getDB();
  const row = db.prepare(
    `SELECT c.id, c.text, c.created_at, d.source AS doc_source, d.type AS doc_type, d.title AS doc_title
     FROM chunks c
     LEFT JOIN documents d ON d.id = c.doc_id
     WHERE c.id = ?`
  ).get(chunkId) as any | undefined;
  if (!row) return undefined;
  return {
    id: row.id as string,
    text: row.text as string,
    createdAt: (row.created_at as number) || Date.now(),
    source: (row.doc_source as string) || "google",
    type: (row.doc_type as string) || "text",
    title: (row.doc_title as string) || undefined,
  };
}

export function getRecentChunksByUser(userId: string, limit = 6, sources?: string[]) {
  const db = getDB();
  const sql = `
    SELECT c.id, c.text, c.created_at, d.source AS doc_source, d.type AS doc_type, d.title AS doc_title
    FROM chunks c
    LEFT JOIN documents d ON d.id = c.doc_id
    WHERE c.user_id = ?
    ${sources && sources.length ? `AND (d.source IN (${sources.map(() => '?').join(',')}))` : ''}
    ORDER BY c.created_at DESC
    LIMIT ?`;
  const params: any[] = [userId];
  if (sources && sources.length) params.push(...sources);
  params.push(limit);
  const rows = (db.prepare(sql).all(...params) as any[]) || [];
  return rows.map(r => ({
    id: r.id as string,
    text: r.text as string,
    createdAt: (r.created_at as number) || Date.now(),
    source: (r.doc_source as string) || 'google',
    type: (r.doc_type as string) || 'text',
    title: (r.doc_title as string) || undefined,
  }));
}

export function searchByKeyword(userId: string, keyword: string, limit = 20) {
  const db = getDB();
  const pat = `%${keyword}%`;
  return db.prepare(
    "SELECT * FROM chunks WHERE user_id = ? AND text LIKE ? ORDER BY created_at DESC LIMIT ?"
  ).all(userId, pat, limit) as any[];
}

export function getUserStats(userId: string) {
  const db = getDB();

  const docRow = db
    .prepare("SELECT COUNT(*) AS count, MAX(created_at) AS last_import_at FROM documents WHERE user_id = ?")
    .get(userId) as { count: number; last_import_at: number | null } | undefined;

  const chunkRow = db
    .prepare("SELECT COUNT(*) AS count FROM chunks WHERE user_id = ?")
    .get(userId) as { count: number } | undefined;

  const sourceRows = db
    .prepare("SELECT COALESCE(source, 'unknown') AS source, COUNT(*) AS count FROM documents WHERE user_id = ? GROUP BY source")
    .all(userId) as Array<{ source: string; count: number }>;

  const sources = sourceRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.source] = row.count;
    return acc;
  }, {});

  return {
    totalDocuments: docRow?.count ?? 0,
    totalChunks: chunkRow?.count ?? 0,
    totalVectors: countVectorsByUser(userId),
    lastImportAt: docRow?.last_import_at ?? null,
    bySource: sources,
  };
}

// Get list of available data sources for a user (for persona prompt)
export function getUserAvailableSources(userId: string): string[] {
  const db = getDB();
  const rows = db
    .prepare("SELECT DISTINCT COALESCE(source, 'unknown') AS source FROM documents WHERE user_id = ?")
    .all(userId) as Array<{ source: string }>;
  return rows.map(r => r.source).filter(s => s && s !== 'unknown');
}

export function migrateUserData(fromUserId: string, toUserId: string) {
  const db = getDB();
  const tx = db.transaction(() => {
    // ensure target user exists
    const exists = db.prepare("SELECT id FROM users WHERE id = ?").get(toUserId);
    if (!exists) {
      db.prepare("INSERT INTO users(id, created_at) VALUES(?, ?)").run(toUserId, Date.now());
    }

    const updates = {
      documents: db.prepare("UPDATE documents SET user_id = ? WHERE user_id = ?").run(toUserId, fromUserId).changes,
      chunks: db.prepare("UPDATE chunks SET user_id = ? WHERE user_id = ?").run(toUserId, fromUserId).changes,
      vectors: db.prepare("UPDATE vectors SET user_id = ? WHERE user_id = ?").run(toUserId, fromUserId).changes,
      users: 0 as number,
    };
    // remove old user row (optional)
    const del = db.prepare("DELETE FROM users WHERE id = ?").run(fromUserId).changes;
    updates.users = del;
    return updates;
  });
  return tx();
}

// ============ User Model Functions ============

export type UserModelRecord = {
  user_id: string;
  model_id: string;
  version: string;
  metadata: string;
  created_at: number;
  updated_at: number;
};

export function getUserDocCount(userId: string): number {
  const db = getDB();
  const row = db.prepare("SELECT COUNT(*) AS count FROM documents WHERE user_id = ?").get(userId) as { count: number } | undefined;
  return row?.count ?? 0;
}

export function getUserModel(userId: string): UserModelRecord | undefined {
  const db = getDB();
  return db.prepare("SELECT * FROM user_models WHERE user_id = ?").get(userId) as UserModelRecord | undefined;
}

export function insertUserModel(model: UserModelRecord) {
  const db = getDB();
  db.prepare(
    `INSERT INTO user_models(user_id, model_id, version, metadata, created_at, updated_at)
     VALUES(@user_id, @model_id, @version, @metadata, @created_at, @updated_at)`
  ).run(model);
}

export function updateUserModel(userId: string, updates: Partial<Omit<UserModelRecord, 'user_id'>>) {
  const db = getDB();
  const setClauses: string[] = [];
  const params: any = { user_id: userId };

  if (updates.model_id !== undefined) {
    setClauses.push('model_id = @model_id');
    params.model_id = updates.model_id;
  }
  if (updates.version !== undefined) {
    setClauses.push('version = @version');
    params.version = updates.version;
  }
  if (updates.metadata !== undefined) {
    setClauses.push('metadata = @metadata');
    params.metadata = updates.metadata;
  }
  if (updates.updated_at !== undefined) {
    setClauses.push('updated_at = @updated_at');
    params.updated_at = updates.updated_at;
  }

  if (setClauses.length === 0) return;

  const sql = `UPDATE user_models SET ${setClauses.join(', ')} WHERE user_id = @user_id`;
  db.prepare(sql).run(params);
}

export function deleteUserModel(userId: string): number {
  const db = getDB();
  const result = db.prepare("DELETE FROM user_models WHERE user_id = ?").run(userId);
  return result.changes;
}

export function getDb() {
  return getDB();
}
