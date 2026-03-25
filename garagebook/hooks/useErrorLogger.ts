'use client';
import { useEffect } from 'react';

const KEY = 'pa_error_log';
const MAX  = 50;

interface LogEntry { ts: string; msg: string; stack?: string; url: string; }

function logError(msg: string, stack?: string) {
  try {
    const log: LogEntry[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    log.unshift({ ts: new Date().toISOString(), msg, stack, url: location.pathname });
    localStorage.setItem(KEY, JSON.stringify(log.slice(0, MAX)));
  } catch { /* storage full — ignore */ }
}

export function getErrorLog(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function clearErrorLog() { localStorage.removeItem(KEY); }

export function useErrorLogger() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => logError(e.message, e.error?.stack);
    const onUnhandled = (e: PromiseRejectionEvent) =>
      logError(`Unhandled: ${e.reason}`, e.reason?.stack);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);
}
