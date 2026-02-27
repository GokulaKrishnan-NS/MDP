"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Connect to the default 'postgres' database first to create 'med_dispense'
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Apple@8102007@localhost:5432/postgres';
const pool = new pg_1.Pool({
    connectionString,
});
async function runMigrate() {
    const client = await pool.connect();
    let appPool = null;
    try {
        console.log(`Connecting to default database: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);
        // 1. Create DB if it doesn't exist
        const dbExistQuery = await client.query("SELECT datname FROM pg_database WHERE datname = 'med_dispense'");
        if (dbExistQuery.rowCount === 0) {
            console.log("Database 'med_dispense' does not exist. Creating...");
            await client.query('CREATE DATABASE med_dispense');
            console.log('Database created.');
        }
        else {
            console.log("Database 'med_dispense' already exists.");
        }
    }
    catch (error) {
        console.error('Error creating database:', error);
        return;
    }
    finally {
        client.release();
        await pool.end();
    }
    // 2. Connect to the newly created 'med_dispense' database to apply schema
    const targetDbString = connectionString.replace(/\/postgres(\?.*)?$/, '/med_dispense$1');
    appPool = new pg_1.Pool({ connectionString: targetDbString });
    try {
        const appClient = await appPool.connect();
        try {
            const schemaPath = path_1.default.join(__dirname, 'schema.sql');
            const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
            console.log('Executing schema.sql on med_dispense database...');
            await appClient.query(schemaSql);
            console.log('Migration completed successfully!');
        }
        finally {
            appClient.release();
        }
    }
    catch (error) {
        console.error('Migration failed:', error);
    }
    finally {
        await appPool.end();
    }
}
runMigrate();
