import { useCallback, useEffect, useState } from "react";
import type { UpdateInfo } from "@/types";
import {
  checkForUpdates as checkForUpdatesCmd,
  installUpdate as installUpdateCmd,
  getCurrentVersion as getCurrentVersionCmd,
} from "@/services/tauri-commands";

interface UseUpdateCheckerReturn {
  currentVersion: string;
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  checking: boolean;
  installing: boolean;
  error: string | null;
  lastChecked: boolean;
  checkForUpdates: (silent?: boolean) => Promise<void>;
  installUpdate: () => Promise<void>;
}

export function useUpdateChecker(autoCheck = true): UseUpdateCheckerReturn {
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState(false);

  useEffect(() => {
    getCurrentVersionCmd()
      .then(setCurrentVersion)
      .catch(() => setCurrentVersion("unknown"));
  }, []);

  const checkForUpdates = useCallback(async (silent = false) => {
    setChecking(true);
    if (!silent) setError(null);
    try {
      const info = await checkForUpdatesCmd();
      setUpdateInfo(info);
      setError(null);
      setLastChecked(true);
    } catch (err) {
      // In silent mode (auto-check), swallow the error.
      // The updater will fail when no signing key is configured or
      // no release exists yet -- that's expected during development.
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "Failed to check for updates",
        );
      }
    } finally {
      setChecking(false);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    setInstalling(true);
    setError(null);
    try {
      await installUpdateCmd();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to install update",
      );
    } finally {
      setInstalling(false);
    }
  }, []);

  useEffect(() => {
    if (autoCheck) {
      // Auto-check runs silently -- errors are suppressed
      checkForUpdates(true);
    }
  }, [autoCheck, checkForUpdates]);

  return {
    currentVersion,
    updateAvailable: updateInfo !== null,
    updateInfo,
    checking,
    installing,
    error,
    lastChecked,
    checkForUpdates,
    installUpdate,
  };
}
