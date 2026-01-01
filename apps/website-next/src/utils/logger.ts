/**
 * Simple Logger Utility for Next.js
 * Minimal implementation without external dependencies
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  component: string;
  data?: unknown;
  timestamp: string;
}

const isDev = process.env.NODE_ENV === 'development';

class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatEntry(entry: LogEntry): string {
    const { level, message, component, data } = entry;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${level.toUpperCase()}] [${component}] ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, component: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      component,
      data,
      timestamp: new Date().toISOString(),
    };

    const formattedMessage = this.formatEntry(entry);

    switch (level) {
      case 'debug':
        if (isDev) console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, component: string, data?: unknown): void {
    this.log('debug', message, component, data);
  }

  info(message: string, component: string, data?: unknown): void {
    this.log('info', message, component, data);
  }

  warn(message: string, component: string, data?: unknown): void {
    this.log('warn', message, component, data);
  }

  error(message: string, component: string, data?: unknown): void {
    this.log('error', message, component, data);
  }
}

export const log = Logger.getInstance();
