const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Banzilla%4025@db.qlflinfxumcoxbbgkcgz.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');
    
    const sqlPath = path.join(__dirname, '../supabase/migrations/20240819000000_dashboard_rpcs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing RPC migration...');
    await client.query(sql);
    console.log('✅ RPC migration applied successfully!');
  } catch (error) {
    console.error('Failed to apply RPC migration:', error);
  } finally {
    await client.end();
  }
}

run();
