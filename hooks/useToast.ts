'use client';

import { useState, useRef, useCallback } from 'react';
import { Toast, ToastType } from '@/types/toast';

const AUTO_DISMISS_MS = 4000;

interface UseToastReturn {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Map of toast id → setTimeout handle for cancellation
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Cancel the auto-dismiss timer if it's still pending
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const toast: Toast = {
        id,
        message,
        type,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, toast]);

      // Schedule auto-dismiss
      const handle = setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);

      timers.current.set(id, handle);
    },
    [],
  );

  return { toasts, addToast, removeToast };
}
