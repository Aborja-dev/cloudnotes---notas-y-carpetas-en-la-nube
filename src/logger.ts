/**
 * Logger for tracking authentication flow events.
 * Provides structured log entries for login-related operations.
 */

export type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  event: string;
  userId?: string;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

const logs: LogEntry[] = [];

/**
 * Log an authentication event.
 */
export function logAuthEvent(
  component: string,
  event: string,
  level: LogLevel = 'info',
  options: {
    userId?: string;
    error?: unknown;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    component,
    event,
    userId: options.userId,
    error: options.error,
    metadata: options.metadata,
  };

  logs.push(entry);

  // Console output with structured formatting
  const timestamp = new Date(entry.timestamp).toISOString();
  const userInfo = entry.userId ? `uid=${entry.userId} ` : '';
  const errorInfo = entry.error
    ? ` | Error: ${entry.error instanceof Error ? entry.error.message : String(entry.error)}`
    : '';

  console.log(
    `[AuthLog] ${timestamp} | ${entry.component} | ${entry.level.toUpperCase()} | ${event} | ${userInfo}${errorInfo}`
  );
}

/**
 * Get all logged entries (for debugging/inspection).
 */
export function getLogs(): LogEntry[] {
  return [...logs];
}

/**
 * Clear all logs.
 */
export function clearLogs(): void {
  logs.length = 0;
}

export default {
  logAuthEvent,
  getLogs,
  clearLogs,
};