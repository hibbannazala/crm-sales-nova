const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Banzilla%4025@db.qlflinfxumcoxbbgkcgz.supabase.co:5432/postgres';

async function updateSchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Terhubung ke Supabase PostgreSQL.');

    const sqlPath = path.join(__dirname, '../supabase/migrations/00000000000001_add_missing_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Mengeksekusi Update Schema...');
    await client.query(sql);
    console.log('✅ Skema tambahan berhasil dibuat di Supabase!');
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat membuat skema:', err);
  } finally {
    await client.end();
  }
}

updateSchema();
