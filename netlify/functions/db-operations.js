// Database Operations for Hosting Manager
// Handles locks, auth sessions, audit logging, and data persistence

const { Client } = require('pg');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Auth credentials
const AUTH_EMAIL = 'admin@advancedmarketing.co';
const AUTH_PASSWORD = 'JEsus777$$!';

async function getClient() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

// Initialize schema if not exists
async function initSchema(client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS hosting_manager;

    CREATE TABLE IF NOT EXISTS hosting_manager.site_locks (
      site_id VARCHAR(255) PRIMARY KEY,
      site_name VARCHAR(255),
      locked BOOLEAN DEFAULT false,
      locked_at TIMESTAMP,
      locked_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hosting_manager.sessions (
      id SERIAL PRIMARY KEY,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hosting_manager.audit_log (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(255),
      details JSONB,
      performed_by VARCHAR(255),
      performed_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// Generate random session token
function generateToken() {
  return 'hm_' + Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  let client;
  try {
    client = await getClient();
    await initSchema(client);

    const { action, ...data } = JSON.parse(event.body || '{}');
    const authHeader = event.headers.authorization;

    switch (action) {
      // ============ AUTH ============
      case 'login': {
        const { email, password } = data;
        if (email === AUTH_EMAIL && password === AUTH_PASSWORD) {
          const token = generateToken();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          await client.query(
            'INSERT INTO hosting_manager.sessions (session_token, email, expires_at) VALUES ($1, $2, $3)',
            [token, email, expiresAt]
          );

          await logAudit(client, 'login', 'session', token, { email }, email);

          return respond(200, { success: true, token, expiresAt });
        }
        return respond(401, { error: 'Invalid credentials' });
      }

      case 'verify-session': {
        const token = authHeader?.replace('Bearer ', '');
        if (!token) return respond(401, { error: 'No token provided' });

        const result = await client.query(
          'SELECT * FROM hosting_manager.sessions WHERE session_token = $1 AND expires_at > NOW()',
          [token]
        );

        if (result.rows.length === 0) {
          return respond(401, { error: 'Invalid or expired session' });
        }

        return respond(200, { valid: true, email: result.rows[0].email });
      }

      case 'logout': {
        const token = authHeader?.replace('Bearer ', '');
        if (token) {
          await client.query('DELETE FROM hosting_manager.sessions WHERE session_token = $1', [token]);
          await logAudit(client, 'logout', 'session', token, {}, 'user');
        }
        return respond(200, { success: true });
      }

      // ============ SITE LOCKS ============
      case 'get-locks': {
        const result = await client.query('SELECT * FROM hosting_manager.site_locks');
        const locks = {};
        result.rows.forEach(row => {
          locks[row.site_id] = {
            locked: row.locked,
            lockedAt: row.locked_at,
            lockedBy: row.locked_by,
            notes: row.notes
          };
        });
        return respond(200, { locks });
      }

      case 'set-lock': {
        const { siteId, siteName, locked, notes } = data;
        const email = await getEmailFromToken(client, authHeader);

        await client.query(`
          INSERT INTO hosting_manager.site_locks (site_id, site_name, locked, locked_at, locked_by, notes, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (site_id) DO UPDATE SET
            locked = $3,
            locked_at = $4,
            locked_by = $5,
            notes = COALESCE($6, hosting_manager.site_locks.notes),
            updated_at = NOW()
        `, [siteId, siteName, locked, locked ? new Date() : null, locked ? email : null, notes]);

        await logAudit(client, locked ? 'lock_site' : 'unlock_site', 'site', siteId, { siteName, notes }, email);

        return respond(200, { success: true, siteId, locked });
      }

      // ============ AUDIT LOG ============
      case 'get-audit-log': {
        const { limit = 50 } = data;
        const result = await client.query(
          'SELECT * FROM hosting_manager.audit_log ORDER BY performed_at DESC LIMIT $1',
          [limit]
        );
        return respond(200, { logs: result.rows });
      }

      default:
        return respond(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('DB Error:', error);
    return respond(500, { error: error.message });
  } finally {
    if (client) await client.end();
  }
};

async function getEmailFromToken(client, authHeader) {
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return 'anonymous';

  const result = await client.query(
    'SELECT email FROM hosting_manager.sessions WHERE session_token = $1',
    [token]
  );
  return result.rows[0]?.email || 'anonymous';
}

async function logAudit(client, action, entityType, entityId, details, performedBy) {
  await client.query(
    'INSERT INTO hosting_manager.audit_log (action, entity_type, entity_id, details, performed_by) VALUES ($1, $2, $3, $4, $5)',
    [action, entityType, entityId, JSON.stringify(details), performedBy]
  );
}

function respond(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}
