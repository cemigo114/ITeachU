/**
 * SQLite database layer for ITeachU backend.
 * DB lives at data/iteachu.db; schema is applied on first use.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'iteachu.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function runSchema(database) {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  database.exec(schema);
}

/**
 * Get (or create) the singleton database instance.
 * @returns {import('better-sqlite3').Database}
 */
export function getDb() {
  if (db) return db;
  ensureDataDir();
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='task'"
  ).get();
  if (!tableExists) {
    runSchema(db);
    console.log('📂 Database schema initialized at', DB_PATH);
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export default getDb;
