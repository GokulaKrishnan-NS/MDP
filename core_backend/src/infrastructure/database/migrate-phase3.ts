import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Apple@8102007@localhost:5432/med_dispense';

// For phase 3 schema, we connect straight to 'med_dispense' as it should already exist
const pool = new Pool({ connectionString });

async function runMigratePhase3() {
    const client = await pool.connect();

    try {
        const schemaPath = path.join(__dirname, 'schema-phase3.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema-phase3.sql on med_dispense database...');
        await client.query(schemaSql);

        console.log('Phase 3 Migration completed successfully!');
    } catch (error) {
        console.error('Phase 3 Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigratePhase3();
