const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Banzilla%4025@db.qlflinfxumcoxbbgkcgz.supabase.co:5432/postgres';

async function initSchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Terhubung ke Supabase PostgreSQL.');

    const sqlPath = path.join(__dirname, '../supabase/migrations/00000000000000_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Mengeksekusi Initial Schema...');
    await client.query(sql);
    console.log('✅ Skema berhasil dibuat di Supabase!');
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat membuat skema:', err);
  } finally {
    await client.end();
  }
}

initSchema();
