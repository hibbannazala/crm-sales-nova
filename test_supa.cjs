const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qlflinfxumcoxbbgkcgz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZmxpbmZ4dW1jb3hiYmdrY2d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY5MTI5OCwiZXhwIjoyMTAyMjY3Mjk4fQ.B0n0fmBNDFsQqO8AZiXYjqPI40S2tq_66QYkkbTIK8Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAuth() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Auth Error:', error);
  } else {
    console.log('Auth Users Count:', users.users.length);
    if (users.users.length > 0) {
      console.log('Sample User:', users.users[0].id, users.users[0].email);
    }
  }
}

checkAuth();
