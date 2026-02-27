import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the default 'postgres' database first to create 'med_dispense'
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Apple@8102007@localhost:5432/postgres';

const pool = new Pool({
    connectionString,
});

async function runMigrate() {
    const client = await pool.connect();
    let appPool: Pool | null = null;

    try {
        console.log(`Connecting to default database: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

        // 1. Create DB if it doesn't exist
        const dbExistQuery = await client.query("SELECT datname FROM pg_database WHERE datname = 'med_dispense'");
        if (dbExistQuery.rowCount === 0) {
            console.log("Database 'med_dispense' does not exist. Creating...");
            await client.query('CREATE DATABASE med_dispense');
            console.log('Database created.');
        } else {
            console.log("Database 'med_dispense' already exists.");
        }
    } catch (error) {
        console.error('Error creating database:', error);
        return;
    } finally {
        client.release();
        await pool.end();
    }

    // 2. Connect to the newly created 'med_dispense' database to apply schema
    const targetDbString = connectionString.replace(/\/postgres(\?.*)?$/, '/med_dispense$1');
    appPool = new Pool({ connectionString: targetDbString });

    try {
        const appClient = await appPool.connect();
        try {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');

            console.log('Executing schema.sql on med_dispense database...');
            await appClient.query(schemaSql);

            console.log('Migration completed successfully!');
        } finally {
            appClient.release();
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await appPool.end();
    }
}

runMigrate();
