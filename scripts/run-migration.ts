/**
 * Script to run SQL migrations against Supabase
 *
 * Usage:
 *   npx tsx scripts/run-migration.ts <migration-file>
 *
 * Example:
 *   npx tsx scripts/run-migration.ts supabase/migrations/004_fix_function_search_path.sql
 *
 * Requirements:
 *   - SUPABASE_SECRET_API_KEY must be set in .env.local
 *   - PUBLIC_SUPABASE_URL must be set in .env.local
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

async function runMigration(migrationPath: string) {
  // Load environment variables
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');

  const supabaseUrl = envContent.match(/PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
  const supabaseKey = envContent.match(/SUPABASE_SECRET_API_KEY=(.+)/)?.[1]?.trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SECRET_API_KEY');
    process.exit(1);
  }

  // Read migration file
  const migrationFile = resolve(process.cwd(), migrationPath);
  console.log(`📖 Reading migration: ${migrationFile}`);

  let sql: string;
  try {
    sql = readFileSync(migrationFile, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to read migration file: ${error}`);
    process.exit(1);
  }

  console.log(`\n📝 Migration SQL (${sql.length} characters):`);
  console.log('─'.repeat(80));
  console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
  console.log('─'.repeat(80));

  // Execute migration using Supabase REST API
  console.log('\n🚀 Executing migration...');

  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Migration failed with status ${response.status}:`);
      console.error(errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration completed successfully!');
    console.log('\nResult:', result);

  } catch (error) {
    console.error('❌ Error executing migration:', error);
    process.exit(1);
  }
}

// Get migration file from command line args
const migrationPath = process.argv[2];

if (!migrationPath) {
  console.error('❌ Usage: npx tsx scripts/run-migration.ts <migration-file>');
  console.error('\nExample:');
  console.error('  npx tsx scripts/run-migration.ts supabase/migrations/004_fix_function_search_path.sql');
  process.exit(1);
}

runMigration(migrationPath);
