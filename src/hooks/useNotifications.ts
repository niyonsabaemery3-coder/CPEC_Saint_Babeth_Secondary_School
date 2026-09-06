/**
 * useNotifications
 * ─────────────────
 * Manages a per-user notification list that is persisted in localStorage.
 * Notifications are keyed by `storageKey` (e.g. "notifs-teacher-42").
 *
 * Design decisions:
 * • "Automatic" notifications are derived from real app data (new resources,
 *   upcoming events, report posted) and are injected once via addIfNew().
 *   They are never re-added once dismissed.
 * • The user can dismiss any notification; dismissed IDs are recorded in
 *   the same storage key so they are never shown again.
 * • No dedicated backend table — entirely client-side, intentionally.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface Notification {
  id: string;
  icon: string;       // Font Awesome class, e.g. "fa-book"
  title: string;
  body: string;
  time: string;       // ISO timestamp
  read: boolean;
}

interface StoredState {
  items: Notification[];
  dismissed: string[];
}

function load(key: string): StoredState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch { /* ignore */ }
  return { items: [], dismissed: [] };
}

function save(key: string, state: StoredState) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
}

export function useNotifications(storageKey: string) {
  const [state, setState] = useState<StoredState>(() => load(storageKey));
  // Track whether initial load from storage is done so we don't write on mount
  const initialised = useRef(false);

  // Persist every time state changes (but skip the very first mount read)
  useEffect(() => {
    if (!initialised.current) { initialised.current = true; return; }
    save(storageKey, state);
  }, [state, storageKey]);

  const unreadCount = state.items.filter((n) => !n.read && !state.dismissed.includes(n.id)).length;
  const visible = state.items.filter((n) => !state.dismissed.includes(n.id));

  /** Add a notification only if its id has never been seen before (not dismissed, not already present). */
  const addIfNew = useCallback((notif: Notification) => {
    setState((prev) => {
      if (prev.dismissed.includes(notif.id)) return prev;
      if (prev.items.some((n) => n.id === notif.id)) return prev;
      return { ...prev, items: [notif, ...prev.items] };
    });
  }, []);

  /** Mark all visible notifications as read. */
  const markAllRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  /** Dismiss (permanently hide) a single notification. */
  const dismiss = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      dismissed: prev.dismissed.includes(id) ? prev.dismissed : [...prev.dismissed, id],
    }));
  }, []);

  /** Dismiss ALL visible notifications at once. */
  const dismissAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dismissed: [...new Set([...prev.dismissed, ...prev.items.map((n) => n.id)])],
    }));
  }, []);

  return { visible, unreadCount, addIfNew, markAllRead, dismiss, dismissAll };
}
