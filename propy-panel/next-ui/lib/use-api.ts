"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export function useApi<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/** Same as useApi but refetches silently on an interval (for live account stats). */
export function usePolling<T = any>(path: string | null, intervalMs: number) {
  const state = useApi<T>(path);
  const { setData } = state;
  useEffect(() => {
    if (!path) return;
    const id = setInterval(() => {
      api<T>(path).then(setData).catch(() => undefined);
    }, intervalMs);
    return () => clearInterval(id);
  }, [path, intervalMs, setData]);
  return state;
}
