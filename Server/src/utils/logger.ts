import winston from 'winston';
import path from 'path';
import config from '../config/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  const env = config.env || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define JSON format for console (when LOG_FORMAT=json)
const jsonConsoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define the format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define the log directory
const logDir = 'logs';

// Determine console format based on LOG_FORMAT env variable
const isJsonFormat = config.logging.format === 'json';

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    // Console transport with conditional format
    new winston.transports.Console({
      format: isJsonFormat ? jsonConsoleFormat : consoleFormat,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'all.log'),
      format: fileFormat,
    }),

    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
    }),
  ],
});

export default logger;
