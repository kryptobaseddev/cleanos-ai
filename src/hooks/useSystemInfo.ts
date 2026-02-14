import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { getSystemInfo, getStorageBreakdown } from "@/services/tauri-commands";

export function useSystemInfo(refreshInterval = 30000) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setSystemInfo, setStorageBreakdown } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const [sysInfo, storage] = await Promise.all([
          getSystemInfo(),
          getStorageBreakdown(),
        ]);
        if (cancelled) return;
        setSystemInfo(sysInfo);
        setStorageBreakdown(storage);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load system info");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    intervalRef.current = setInterval(fetch, refreshInterval);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, setSystemInfo, setStorageBreakdown]);

  return { loading, error };
}
