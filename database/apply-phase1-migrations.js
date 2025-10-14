/**
 * Apply Phase 1 (v3) Database Migrations
 * 
 * This script applies migrations 0008-0011 for Phase 1 of the v3 upgrade:
 * - 0008: Core contract-scoped tables
 * - 0009: User contract roles helper table
 * - 0010: Seed data for v3 tables
 * - 0011: RLS policies for contract-scoped access
 * 
 * Note: Migration 0012 (storage setup) must be done manually via Supabase Dashboard
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files to apply in order
const migrations = [
    '0008_v3_core_tables.sql',
    '0009_user_contract_roles.sql',
    '0010_v3_seed_data.sql',
    '0011_v3_rls_policies.sql'
];

async function applyMigration(filename) {
    console.log(`\n📄 Applying migration: ${filename}`);
    
    const filePath = path.join(__dirname, 'migrations', filename);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        return false;
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
        // Execute the SQL migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            // If exec_sql function doesn't exist, try direct query
            console.log('⚠️  exec_sql function not found, trying direct execution...');
            
            // Split by semicolons and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            
            for (const statement of statements) {
                const { error: stmtError } = await supabase.rpc('exec', { 
                    query: statement 
                });
                
                if (stmtError) {
                    console.error(`❌ Error executing statement: ${stmtError.message}`);
                    console.error(`Statement: ${statement.substring(0, 100)}...`);
                    return false;
                }
            }
        }
        
        console.log(`✅ Successfully applied: ${filename}`);
        return true;
    } catch (err) {
        console.error(`❌ Error applying migration ${filename}:`, err.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Phase 1 Database Migrations');
    console.log('=' .repeat(60));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const migration of migrations) {
        const success = await applyMigration(migration);
        if (success) {
            successCount++;
        } else {
            failCount++;
            console.log('\n⚠️  Migration failed. You may need to apply remaining migrations manually.');
            break;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    
    if (failCount === 0) {
        console.log('\n✨ All Phase 1 migrations applied successfully!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Set up Storage bucket manually (see database/migrations/0012_storage_setup.md)');
        console.log('   2. Update seed data in 0010_v3_seed_data.sql with actual user IDs');
        console.log('   3. Run tests to verify Phase 1 acceptance criteria');
    } else {
        console.log('\n⚠️  Some migrations failed. Please check errors above.');
        console.log('   You may need to apply migrations manually via Supabase SQL Editor.');
    }
}

// Alternative: Manual application instructions
function printManualInstructions() {
    console.log('\n📋 MANUAL APPLICATION INSTRUCTIONS');
    console.log('=' .repeat(60));
    console.log('If automated migration fails, apply these files manually via Supabase SQL Editor:');
    console.log('');
    
    migrations.forEach((migration, index) => {
        console.log(`${index + 1}. database/migrations/${migration}`);
    });
    
    console.log('\nCopy the contents of each file and paste into the Supabase SQL Editor.');
    console.log('Execute them in the order listed above.');
    console.log('');
}

// Run migrations
main().catch(err => {
    console.error('❌ Fatal error:', err);
    printManualInstructions();
    process.exit(1);
});
