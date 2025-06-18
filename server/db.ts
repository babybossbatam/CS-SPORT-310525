import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection with better error handling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false
};

export const pool = new Pool(poolConfig);

// Add error event handlers
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

export const db = drizzle({ client: pool, schema });

// Track if pool is ending to prevent "pool after calling end" errors
let isPoolEnding = false;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  if (isPoolEnding) return;
  
  console.log(`Received ${signal}, closing database connections...`);
  isPoolEnding = true;
  
  try {
    await pool.end();
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Export a function to check if pool is available
export const isPoolAvailable = () => !isPoolEnding;
