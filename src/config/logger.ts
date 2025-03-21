import winston from 'winston';
import { env } from './env.config';

const logger = winston.createLogger({
  silent: env.NODE_ENV === 'test',
  level: env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'image-processing-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${level} ${timestamp}: ${message} ${metaStr}`;
        })
      )
    }),
    new winston.transports.File({
      filename: env.LOG_ERROR_FILE,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: env.LOG_COMBINED_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// If we're not in production, log to the console with colors
if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  log(level: LogLevel, message: string, meta?: any): void {
    this.logger.log(level, message, meta);
  }

  httpRequest(req: any): void {
    this.logger.http(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    });
  }

  errorWithStack(error: Error, message?: string): void {
    this.error(message || error.message, {
      stack: error.stack,
      name: error.name
    });
  }

  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

export const loggerInstance = new Logger(logger);

export { loggerInstance as logger };