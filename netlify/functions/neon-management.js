// Neon Database Management API
// Handles creating databases, managing connections, viewing tables

const { Client } = require('pg');
const NEON_API = 'https://console.neon.tech/api/v2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const neonApiKey = process.env.NEON_API_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  try {
    const { action, ...data } = JSON.parse(event.body || '{}');

    switch (action) {
      // ============ LIST PROJECTS ============
      case 'list-projects': {
        if (!neonApiKey) {
          // Return just the main database if no API key
          return respond(200, {
            projects: [{
              id: 'main',
              name: 'neondb (Primary)',
              host: 'ep-aged-river-ah63sktg-pooler.us-east-1.aws.neon.tech',
              status: 'active'
            }]
          });
        }

        const response = await fetch(`${NEON_API}/projects`, {
          headers: { 'Authorization': `Bearer ${neonApiKey}` }
        });
        const result = await response.json();

        return respond(200, { projects: result.projects || [] });
      }

      // ============ GET DATABASE STATS ============
      case 'get-db-stats': {
        if (!databaseUrl) {
          return respond(500, { error: 'DATABASE_URL not configured' });
        }

        const client = new Client({ connectionString: databaseUrl });
        await client.connect();

        // Get schema info
        const schemasResult = await client.query(`
          SELECT schema_name FROM information_schema.schemata
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        `);

        // Get table counts per schema
        const tablesResult = await client.query(`
          SELECT table_schema, COUNT(*) as table_count
          FROM information_schema.tables
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          GROUP BY table_schema
        `);

        // Get database size
        const sizeResult = await client.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);

        // Get total row counts estimate
        const rowsResult = await client.query(`
          SELECT SUM(n_live_tup) as total_rows
          FROM pg_stat_user_tables
        `);

        await client.end();

        return respond(200, {
          schemas: schemasResult.rows.map(r => r.schema_name),
          tablesBySchema: tablesResult.rows.reduce((acc, r) => {
            acc[r.table_schema] = parseInt(r.table_count);
            return acc;
          }, {}),
          size: sizeResult.rows[0]?.size || 'Unknown',
          totalRows: parseInt(rowsResult.rows[0]?.total_rows) || 0
        });
      }

      // ============ LIST TABLES ============
      case 'list-tables': {
        if (!databaseUrl) {
          return respond(500, { error: 'DATABASE_URL not configured' });
        }

        const { schema = 'public' } = data;
        const client = new Client({ connectionString: databaseUrl });
        await client.connect();

        const result = await client.query(`
          SELECT
            t.table_name,
            t.table_type,
            pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size,
            (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count,
            s.n_live_tup as row_count
          FROM information_schema.tables t
          LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.table_schema AND s.relname = t.table_name
          WHERE t.table_schema = $1
          ORDER BY t.table_name
        `, [schema]);

        await client.end();

        return respond(200, {
          schema,
          tables: result.rows.map(r => ({
            name: r.table_name,
            type: r.table_type,
            size: r.size,
            columns: parseInt(r.column_count),
            rows: parseInt(r.row_count) || 0
          }))
        });
      }

      // ============ GET TABLE SCHEMA ============
      case 'get-table-schema': {
        if (!databaseUrl) {
          return respond(500, { error: 'DATABASE_URL not configured' });
        }

        const { schema = 'public', table } = data;
        const client = new Client({ connectionString: databaseUrl });
        await client.connect();

        const columnsResult = await client.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schema, table]);

        // Get primary key
        const pkResult = await client.query(`
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = ($1 || '.' || $2)::regclass AND i.indisprimary
        `, [schema, table]);

        await client.end();

        return respond(200, {
          schema,
          table,
          columns: columnsResult.rows,
          primaryKey: pkResult.rows.map(r => r.attname)
        });
      }

      // ============ EXECUTE QUERY ============
      case 'execute-query': {
        if (!databaseUrl) {
          return respond(500, { error: 'DATABASE_URL not configured' });
        }

        const { query, params = [] } = data;

        // Basic safety check - only allow SELECT, INSERT, UPDATE for now
        const upperQuery = query.trim().toUpperCase();
        if (!upperQuery.startsWith('SELECT') &&
            !upperQuery.startsWith('INSERT') &&
            !upperQuery.startsWith('UPDATE') &&
            !upperQuery.startsWith('CREATE TABLE') &&
            !upperQuery.startsWith('CREATE SCHEMA')) {
          return respond(400, { error: 'Only SELECT, INSERT, UPDATE, and CREATE statements are allowed' });
        }

        const client = new Client({ connectionString: databaseUrl });
        await client.connect();

        try {
          const result = await client.query(query, params);
          await client.end();

          return respond(200, {
            rowCount: result.rowCount,
            rows: result.rows?.slice(0, 1000), // Limit to 1000 rows
            fields: result.fields?.map(f => f.name)
          });
        } catch (queryError) {
          await client.end();
          return respond(400, { error: queryError.message });
        }
      }

      // ============ CREATE SCHEMA ============
      case 'create-schema': {
        if (!databaseUrl) {
          return respond(500, { error: 'DATABASE_URL not configured' });
        }

        const { schemaName } = data;

        if (!/^[a-z_][a-z0-9_]*$/.test(schemaName)) {
          return respond(400, { error: 'Invalid schema name. Use lowercase letters, numbers, and underscores.' });
        }

        const client = new Client({ connectionString: databaseUrl });
        await client.connect();

        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
        await client.end();

        return respond(200, { success: true, schema: schemaName });
      }

      default:
        return respond(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Neon Management Error:', error);
    return respond(500, { error: error.message });
  }
};

function respond(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}
