import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runFixes() {
    console.log('🚀 Running Realtime & Publication fixes...');

    const queries = [
        // 1. Ensure publication exists and add tables
        `DO $$ 
         BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
             CREATE PUBLICATION supabase_realtime;
           END IF;
         END $$;`,

        `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`,
        `ALTER PUBLICATION supabase_realtime ADD TABLE wishlists;`,
        `ALTER PUBLICATION supabase_realtime ADD TABLE conversations;`,

        // 2. Enable REPLICA IDENTITY FULL for these tables (required for Realtime to send full payloads)
        `ALTER TABLE messages REPLICA IDENTITY FULL;`,
        `ALTER TABLE wishlists REPLICA IDENTITY FULL;`,
        `ALTER TABLE conversations REPLICA IDENTITY FULL;`
    ];

    for (const query of queries) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: query });
            if (error) {
                // If rpc fails, try raw postgres through another method if available, 
                // but usually rpc is the way if enabled.
                console.error(`❌ Error executing query: ${query.substring(0, 50)}...`, error);
            } else {
                console.log(`✅ Executed: ${query.substring(0, 50)}...`);
            }
        } catch (err: any) {
            console.error(`❌ Exception executing: ${query.substring(0, 50)}...`, err.message);
        }
    }
}

// Since exec_sql might not be available, I will provide the SQL to the user 
// but first I'll check if there's any other way for me to run SQL.
// Actually, I can't use rpc if it's not defined. I'll just tell the user I've prepared the commands.

runFixes();
