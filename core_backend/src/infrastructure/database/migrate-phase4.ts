import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Apple@8102007@localhost:5432/med_dispense';

const pool = new Pool({ connectionString });

async function runMigratePhase4() {
    const client = await pool.connect();

    try {
        const schemaPath = path.join(__dirname, 'schema-phase4.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema-phase4.sql on med_dispense database...');
        await client.query(schemaSql);

        console.log('Phase 4 Migration completed successfully!');
    } catch (error) {
        console.error('Phase 4 Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigratePhase4();
