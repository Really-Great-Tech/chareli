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
    // Optimized for Supabase transaction pooler (port 6543)
    // Lower max connections since pooler handles actual DB connections
    max: 15, // Maximum pool size
    connectionTimeoutMillis: 30000, // 30s connection timeout
    statement_timeout: 60000, // 60s statement timeout
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
