import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    // In a real app, these come from environment variables
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/med_dispense'
});

export class Database {
    /**
     * Executes a callback within an ACID transaction.
     * If the callback throws an error, the transaction is rolled back.
     */
    public static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    public static async query(text: string, params?: any[]) {
        return pool.query(text, params);
    }

    public static async getClient(): Promise<PoolClient> {
        return pool.connect();
    }
}
