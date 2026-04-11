'use client';
import { useEffect } from 'react';

const KEY     = 'pa_error_log';
const ACT_KEY = 'pa_activity_log';
const MAX     = 100;

export type LogLevel = 'error' | 'warn' | 'info' | 'api' | 'action' | 'perf';

export interface LogEntry {
  ts:       string;
  level:    LogLevel;
  msg:      string;
  stack?:   string;
  url:      string;
  details?: Record<string, unknown>;
  duration?: number; // ms
  userAgent?: string;
}

// ── Core log writer ────────────────────────────────────────────
function writeLog(key: string, entry: LogEntry) {
  try {
    const log: LogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    log.unshift(entry);
    localStorage.setItem(key, JSON.stringify(log.slice(0, MAX)));
  } catch { /* storage full */ }
}

function makeEntry(level: LogLevel, msg: string, extra?: Partial<LogEntry>): LogEntry {
  return {
    ts:        new Date().toISOString(),
    level,
    msg,
    url:       typeof location !== 'undefined' ? location.pathname : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : '',
    ...extra,
  };
}

// ── Public API ─────────────────────────────────────────────────
export function logError(msg: string, stack?: string, details?: Record<string, unknown>) {
  writeLog(KEY, makeEntry('error', msg, { stack, details }));
}

export function logWarn(msg: string, details?: Record<string, unknown>) {
  writeLog(KEY, makeEntry('warn', msg, { details }));
}

export function logInfo(msg: string, details?: Record<string, unknown>) {
  writeLog(ACT_KEY, makeEntry('info', msg, { details }));
}

export function logAction(action: string, details?: Record<string, unknown>) {
  writeLog(ACT_KEY, makeEntry('action', action, { details }));
}

export function logPerf(label: string, durationMs: number) {
  if (durationMs > 2000) // only log slow operations
    writeLog(ACT_KEY, makeEntry('perf', label, { duration: durationMs }));
}

// ── API fetch wrapper ──────────────────────────────────────────
export async function loggedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const url     = typeof input === 'string' ? input : input.url;
  const method  = init?.method || 'GET';
  const start   = performance.now();

  try {
    const res      = await fetch(input, init);
    const duration = Math.round(performance.now() - start);

    writeLog(ACT_KEY, makeEntry('api', `${method} ${url} → ${res.status}`, {
      duration,
      details: { status: res.status, ok: res.ok, method, url },
    }));

    if (!res.ok) {
      logWarn(`API error: ${method} ${url} → ${res.status}`, { method, url, status: res.status, duration });
    }

    return res;
  } catch (e) {
    const duration = Math.round(performance.now() - start);
    logError(`API failed: ${method} ${url}`, (e as Error)?.stack, { method, url, duration });
    throw e;
  }
}

// ── Log readers ────────────────────────────────────────────────
export function getErrorLog():    LogEntry[] { try { return JSON.parse(localStorage.getItem(KEY)     || '[]'); } catch { return []; } }
export function getActivityLog(): LogEntry[] { try { return JSON.parse(localStorage.getItem(ACT_KEY) || '[]'); } catch { return []; } }
export function clearErrorLog()   { localStorage.removeItem(KEY); }
export function clearActivityLog(){ localStorage.removeItem(ACT_KEY); }
export function clearAllLogs()    { localStorage.removeItem(KEY); localStorage.removeItem(ACT_KEY); }

// ── Hook ───────────────────────────────────────────────────────
export function useErrorLogger() {
  useEffect(() => {
    // JS errors
    const onError = (e: ErrorEvent) => {
      logError(e.message, e.error?.stack, {
        filename: e.filename,
        lineno:   e.lineno,
        colno:    e.colno,
      });
    };

    // Unhandled promise rejections
    const onUnhandled = (e: PromiseRejectionEvent) => {
      logError(`Unhandled Promise: ${e.reason}`, e.reason?.stack);
    };

    // Page visibility — track when user comes back
    const onVisible = () => {
      if (document.visibilityState === 'visible')
        logInfo('App resumed', { url: location.pathname });
    };

    // Online/offline
    const onOnline  = () => logInfo('Network: online');
    const onOffline = () => logWarn('Network: offline');

    // Page navigation
    logInfo('Page visit', { url: location.pathname, referrer: document.referrer });

    // Performance — page load time
    if (typeof performance !== 'undefined') {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) logPerf('Page load', Math.round(nav.loadEventEnd - nav.startTime));
    }

    window.addEventListener('error',              onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online',             onOnline);
    window.addEventListener('offline',            onOffline);

    return () => {
      window.removeEventListener('error',              onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online',             onOnline);
      window.removeEventListener('offline',            onOffline);
    };
  }, []);
}
