import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../config/logger';

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'call_logs_db',
  user: process.env.DB_USER || 'calluser',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const initDb = async () => {
  try {
    logger.info('Initializing database tables...');

    // Read the schema.sql file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the SQL
    await pool.query(schemaSql);

    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error creating database tables:', {
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await pool.end();
    logger.info('Database connection closed');
  }
};

// Run the initialization
initDb();