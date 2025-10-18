import pkg from 'pg';
import { randomUUID } from 'node:crypto';
import type { User } from '@shared/api';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

let pool: any = null;
export let enabled = false;

export async function initDb() {
  if (!DATABASE_URL) return;
  pool = new Pool({ connectionString: DATABASE_URL });
  enabled = true;
  // create users table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  // seed default users if table empty
  const res = await pool.query('SELECT COUNT(*)::int as cnt FROM users');
  const cnt = res.rows?.[0]?.cnt ?? 0;
  if (cnt === 0) {
    const now = new Date().toISOString();
    // default password for seeded users: 'password'
    const seeded = [
      { id: randomUUID(), name: 'Alex Admin', email: 'alex.admin@example.com', role: 'ADMIN' },
      { id: randomUUID(), name: 'Morgan Manager', email: 'morgan.manager@example.com', role: 'MANAGER' },
      { id: randomUUID(), name: 'Devon Dev', email: 'devon.dev@example.com', role: 'DEVELOPER' },
      { id: randomUUID(), name: 'Riley Dev', email: 'riley.dev@example.com', role: 'DEVELOPER' },
    ];
    const insertText = 'INSERT INTO users(id,name,email,role,password,created_at) VALUES($1,$2,$3,$4,$5,$6)';
    const { hashPassword } = await import('../utils/password');
    for (const u of seeded) {
      const pwd = hashPassword('password');
      await pool.query(insertText, [u.id, u.name, u.email, u.role, pwd, now]);
    }
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (!enabled) throw new Error('DB not enabled');
  const res = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return res.rows.map((r: any) => ({ id: r.id, name: r.name, email: r.email, role: r.role as User['role'], createdAt: r.created_at }));
}

export async function getUserById(id: string): Promise<User | null> {
  if (!enabled) throw new Error('DB not enabled');
  const res = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
  if (!res.rows[0]) return null;
  const r = res.rows[0];
  return { id: r.id, name: r.name, email: r.email, role: r.role as User['role'], createdAt: r.created_at };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!enabled) throw new Error('DB not enabled');
  const res = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]);
  if (!res.rows[0]) return null;
  const r = res.rows[0];
  return { id: r.id, name: r.name, email: r.email, role: r.role as User['role'], createdAt: r.created_at };
}

export async function verifyUserCredentials(email: string, password: string): Promise<User | null> {
  if (!enabled) throw new Error('DB not enabled');
  const { hashPassword } = await import('../utils/password');
  const res = await pool.query('SELECT id, name, email, role, password, created_at FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]);
  if (!res.rows[0]) return null;
  const r = res.rows[0];
  const hashed = r.password as string | null;
  if (!hashed) return null;
  if (hashPassword(password) !== hashed) return null;
  return { id: r.id, name: r.name, email: r.email, role: r.role as User['role'], createdAt: r.created_at };
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'> & { password?: string }): Promise<User> {
  if (!enabled) throw new Error('DB not enabled');
  const id = randomUUID();
  const now = new Date().toISOString();
  if ((user as any).password) {
    const { hashPassword } = await import('../utils/password');
    const h = hashPassword((user as any).password);
    await pool.query('INSERT INTO users(id,name,email,role,password,created_at) VALUES($1,$2,$3,$4,$5,$6)', [id, user.name, user.email, user.role, h, now]);
  } else {
    await pool.query('INSERT INTO users(id,name,email,role,created_at) VALUES($1,$2,$3,$4,$5)', [id, user.name, user.email, user.role, now]);
  }
  return { id, name: user.name, email: user.email, role: user.role as User['role'], createdAt: now };
}

export async function updateUser(id: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
  if (!enabled) throw new Error('DB not enabled');
  const existing = await getUserById(id);
  if (!existing) return null;
  const name = patch.name ?? existing.name;
  const email = patch.email ?? existing.email;
  const role = patch.role ?? existing.role;
  await pool.query('UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4', [name, email, role, id]);
  return { id, name, email, role, createdAt: existing.createdAt };
}

export async function deleteUser(id: string): Promise<User | null> {
  if (!enabled) throw new Error('DB not enabled');
  const existing = await getUserById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  return existing;
}
