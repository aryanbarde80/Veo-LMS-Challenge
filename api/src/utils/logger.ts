enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private format(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = `[${entry.level}]`;
    const message = entry.message;
    const context = entry.context ? JSON.stringify(entry.context) : '';
    const error = entry.error ? `\nError: ${entry.error}` : '';

    return `${timestamp} ${level} ${message} ${context}${error}`;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.isDevelopment) return;

    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.DEBUG,
      message,
      context,
    };

    console.log(this.format(entry));
  }

  info(message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      message,
      context,
    };

    console.log(this.format(entry));
  }

  warn(message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.WARN,
      message,
      context,
    };

    console.warn(this.format(entry));
  }

  error(message: string, error?: Error | null, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error?.message,
    };

    console.error(this.format(entry));

    if (error && this.isDevelopment) {
      console.error(error.stack);
    }
  }

  http(method: string, path: string, statusCode: number, responseTime: number) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      message: `HTTP ${method} ${path}`,
      context: {
        statusCode,
        responseTime: `${responseTime}ms`,
      },
    };

    console.log(this.format(entry));
  }
}

export const logger = new Logger();
