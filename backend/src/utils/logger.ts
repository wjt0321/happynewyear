/**
 * 统一日志记录系统
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private enableConsole = true;
  private context?: string;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setContext(context: string): Logger {
    const logger = new Logger();
    logger.context = context;
    return logger;
  }

  disableConsole(): void {
    this.enableConsole = false;
  }

  enableConsoleOutput(): void {
    this.enableConsole = true;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level} ${contextStr} ${message}`;
  }

  private addLogEntry(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      context: this.context,
      data
    };

    this.addLogEntry(entry);

    if (this.enableConsole) {
      console.debug(this.formatMessage('DEBUG', message, this.context), data || '');
    }
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context: this.context,
      data
    };

    this.addLogEntry(entry);

    if (this.enableConsole) {
      console.info(this.formatMessage('INFO', message, this.context), data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context: this.context,
      data
    };

    this.addLogEntry(entry);

    if (this.enableConsole) {
      console.warn(this.formatMessage('WARN', message, this.context), data || '');
    }
  }

  error(message: string, error?: Error | any, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context: this.context,
      error: error instanceof Error ? error : undefined,
      data: error instanceof Error ? data : error
    };

    this.addLogEntry(entry);

    if (this.enableConsole) {
      console.error(this.formatMessage('ERROR', message, this.context), error || data || '');
    }
  }

  fatal(message: string, error?: Error | any): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'FATAL',
      message,
      context: this.context,
      error: error instanceof Error ? error : undefined
    };

    this.addLogEntry(entry);

    if (this.enableConsole) {
      console.error(this.formatMessage('FATAL', message, this.context), error || '');
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logBuffer.filter(entry => {
        const entryLevel = LogLevel[entry.level as keyof typeof LogLevel];
        return entryLevel >= level;
      });
    }
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    
    for (const entry of this.logBuffer) {
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
    }

    return {
      total: this.logBuffer.length,
      byLevel
    };
  }
}

export const logger = Logger.getInstance();

export const createLogger = (context: string): Logger => {
  const logger = Logger.getInstance();
  return logger.setContext(context);
};