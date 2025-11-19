/**
 * Logger Utility
 *
 * Centralized logging with levels and environment-aware behavior
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel;
  private enableRemoteLogging: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private constructor() {
    // Set log level based on environment
    this.currentLevel =
      import.meta.env.MODE === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    this.enableRemoteLogging = import.meta.env.PROD;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown
  ): void {
    if (level < this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context || '',
      data,
    };

    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.consoleLog(entry);

    // Remote logging for errors in production
    if (this.enableRemoteLogging && level >= LogLevel.ERROR) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Output to console with appropriate method
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = entry.context ? `[${entry.context}]` : '';
    const timestamp = entry.timestamp.toISOString();

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${timestamp} ${prefix} ${entry.message}`, entry.data);
        break;
      case LogLevel.INFO:
        console.info(`${timestamp} ${prefix} ${entry.message}`, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(`${timestamp} ${prefix} ${entry.message}`, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(`${timestamp} ${prefix} ${entry.message}`, entry.data);
        break;
    }
  }

  /**
   * Send log to remote logging service (Application Insights, etc.)
   */
  private sendToRemote(entry: LogEntry): void {
    // Import Application Insights lazily
    import('./applicationInsights')
      .then((module) => {
        const insights = module.getApplicationInsights();
        if (insights) {
          insights.trackException({
            exception: new Error(entry.message),
            properties: {
              context: entry.context,
              data: JSON.stringify(entry.data),
              timestamp: entry.timestamp.toISOString(),
            },
          });
        }
      })
      .catch((error) => {
        console.error('Failed to send log to remote:', error);
      });
  }

  /**
   * Get recent logs
   */
  getLogs(limit?: number): LogEntry[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const log = {
  debug: (message: string, context?: string, data?: unknown) =>
    logger.debug(message, context, data),
  info: (message: string, context?: string, data?: unknown) =>
    logger.info(message, context, data),
  warn: (message: string, context?: string, data?: unknown) =>
    logger.warn(message, context, data),
  error: (message: string, context?: string, data?: unknown) =>
    logger.error(message, context, data),
};
