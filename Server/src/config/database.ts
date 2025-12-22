import { DataSource } from 'typeorm';
import config from './config';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: false, // Set to false to disable SQL query logs
  entities: [path.join(__dirname, '../entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.{ts,js}')],
  extra: {
    // Environment-based connection pooling for Supabase
    // Respects Supavisor pooler limits based on compute tier
    //
    // Supabase Micro (dev): 200 max pooler clients
    // - 20 instances × 5 = 100 connections (50% capacity, safe margin)
    //
    // Production: Adjust based on Supabase tier
    // - Small (400 pooler): 20 instances × 10 = 200 (50% capacity)
    // - Medium (600 pooler): 20 instances × 15 = 300 (50% capacity)
    max: config.env === 'production' ? 10 : 5,

    // Connection management
    connectionTimeoutMillis: 30000, // 30s connection timeout
    statement_timeout: 60000, // 60s statement timeout

    // Ensure connections are released promptly
    idleTimeoutMillis: 30000, // Release idle connections after 30s
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};
