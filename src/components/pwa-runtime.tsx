/**
 * Install prompt + production service worker.
 * The worker is not registered in dev — a cached Vite shell breaks the live preview.
 * getSnapshot must return a stable object. A fresh object each call loops React.
 */
import { useEffect, useSyncExternalStore } from "react";

type BeforeInstall = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallSnap = { deferred: BeforeInstall | null; installed: boolean };

let deferred: BeforeInstall | null = null;
let installed = false;
const listeners = new Set<() => void>();
const serverSnap: InstallSnap = { deferred: null, installed: false };
let snap: InstallSnap = serverSnap;

function emit() {
  snap = { deferred, installed };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallPrompt() {
  return useSyncExternalStore(subscribe, () => snap, () => serverSnap);
}

function bindInstall() {
  const onPrompt = (event: Event) => {
    event.preventDefault();
    deferred = event as BeforeInstall;
    emit();
  };
  const onInstalled = () => {
    installed = true;
    deferred = null;
    emit();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function PwaRuntime() {
  useEffect(() => {
    const unbind = bindInstall();
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return unbind;
  }, []);
  return null;
}

export async function runInstallPrompt() {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice.catch(() => undefined);
  deferred = null;
  emit();
}
