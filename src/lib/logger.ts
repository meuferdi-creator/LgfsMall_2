export type LogLevel = "info" | "warn" | "error" | "fatal";
export type LogCategory = "auth" | "firestore" | "storage" | "network" | "runtime" | "ui";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  stack?: string;
  userAgent?: string;
}

const MAX_LOGS_IN_STORAGE = 100;
const STORAGE_KEY = "lgf_production_logs";

class LoggerService {
  private logs: LogEntry[] = [];

  constructor() {
    this.loadLogsFromStorage();
    this.setupGlobalHandlers();
  }

  private loadLogsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS_IN_STORAGE)));
    } catch (err) {
      console.warn("Could not persist logs to localStorage:", err);
    }
  }

  private setupGlobalHandlers() {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.log({
        level: "error",
        category: "runtime",
        message: event.message || "Uncaught runtime exception",
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        stack: event.error?.stack,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.log({
        level: "error",
        category: "runtime",
        message: event.reason?.message || "Unhandled Promise Rejection",
        details: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  public log(entry: {
    level: LogLevel;
    category: LogCategory;
    message: string;
    details?: any;
    stack?: string;
  }): LogEntry {
    const fullEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      ...entry,
    };

    this.logs.push(fullEntry);
    this.saveLogsToStorage();

    // Print to console cleanly in dev or runtime
    const consoleMethod = entry.level === "fatal" || entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
    console[consoleMethod](
      `[LGF ${entry.category.toUpperCase()}] [${entry.level.toUpperCase()}] ${entry.message}`,
      entry.details || ""
    );

    return fullEntry;
  }

  public logAuthError(message: string, error?: any) {
    return this.log({
      level: "error",
      category: "auth",
      message,
      details: error?.message || error,
      stack: error?.stack,
    });
  }

  public logFirestoreError(message: string, error?: any) {
    return this.log({
      level: "warn",
      category: "firestore",
      message,
      details: error?.message || error,
      stack: error?.stack,
    });
  }

  public logStorageError(message: string, error?: any) {
    return this.log({
      level: "error",
      category: "storage",
      message,
      details: error?.message || error,
      stack: error?.stack,
    });
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const logger = new LoggerService();
