"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    // In a real app, these come from environment variables
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/med_dispense'
});
class Database {
    /**
     * Executes a callback within an ACID transaction.
     * If the callback throws an error, the transaction is rolled back.
     */
    static async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async query(text, params) {
        return pool.query(text, params);
    }
    static async getClient() {
        return pool.connect();
    }
}
exports.Database = Database;
