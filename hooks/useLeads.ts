'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToastContext } from '@/contexts/ToastContext';
import type { Lead, LeadStatus } from '@/types/lead';

interface UseLeadsReturn {
  leads: Lead[];
  filteredLeads: Lead[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  retry: () => void;
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const { addToast } = useToastContext();

  useEffect(() => {
    let cancelled = false;

    async function fetchLeads() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/leads');
        if (!res.ok) {
          throw new Error(`Failed to fetch leads (${res.status})`);
        }
        const raw = await res.json();
        // JSON serialises Date as ISO strings — convert them back to Date objects
        const data: Lead[] = raw.map((l: Lead & { createdAt: string; updatedAt: string }) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt),
        }));
        if (!cancelled) {
          setLeads(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load leads');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchLeads();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q),
    );
  }, [leads, searchQuery]);

  const updateStatus = useCallback(
    async (id: string, status: LeadStatus): Promise<void> => {
      // 1. Optimistic update
      const previous = leads;
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l)),
      );

      try {
        const res = await fetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (res.ok) {
          // 3. Success
          addToast('Status Updated', 'success');
        } else {
          // 4. Failure — revert
          setLeads(previous);
          addToast('Failed to update status. Please try again.', 'error');
        }
      } catch {
        // 4. Network / unexpected failure — revert
        setLeads(previous);
        addToast('Failed to update status. Please try again.', 'error');
      }
    },
    [leads, addToast],
  );

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return {
    leads,
    filteredLeads,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    updateStatus,
    retry,
  };
}
