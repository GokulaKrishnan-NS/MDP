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
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Apple@8102007@localhost:5432/med_dispense';
// For phase 3 schema, we connect straight to 'med_dispense' as it should already exist
const pool = new pg_1.Pool({ connectionString });
async function runMigratePhase3() {
    const client = await pool.connect();
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema-phase3.sql');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
        console.log('Executing schema-phase3.sql on med_dispense database...');
        await client.query(schemaSql);
        console.log('Phase 3 Migration completed successfully!');
    }
    catch (error) {
        console.error('Phase 3 Migration failed:', error);
    }
    finally {
        client.release();
        await pool.end();
    }
}
runMigratePhase3();
