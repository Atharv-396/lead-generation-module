'use client';

/**
 * hooks/useLeadForm.ts
 *
 * Manages form state, client-side validation, and API submission for the
 * lead capture form.
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 13.1
 */

import { useState, useCallback } from 'react';
import type { LeadFormFields } from '@/types/lead';
import { createLeadSchema } from '@/lib/schemas';
import { useToastContext } from '@/contexts/ToastContext';
import { auth } from '@/lib/firebase-client';

const INITIAL_FIELDS: LeadFormFields = {
  name: '',
  email: '',
  budget: '' as LeadFormFields['budget'],
  message: '',
};

const FETCH_TIMEOUT_MS = 10_000;

export interface UseLeadFormReturn {
  fields: LeadFormFields;
  errors: Partial<Record<keyof LeadFormFields, string>>;
  isLoading: boolean;
  handleChange: (field: keyof LeadFormFields, value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useLeadForm(): UseLeadFormReturn {
  const [fields, setFields] = useState<LeadFormFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormFields, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { addToast } = useToastContext();

  /**
   * Update a single field and clear its validation error.
   */
  const handleChange = useCallback(
    (field: keyof LeadFormFields, value: string) => {
      setFields((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (!prev[field]) return prev; // nothing to clear — avoid unnecessary re-render
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  /**
   * Validate fields client-side, then POST to /api/leads on success.
   *
   * Validation:  uses createLeadSchema.safeParse — all errors reported at once.
   * Submission:  AbortController with a 10-second timeout cancels the fetch on
   *              network hangs.
   * Toasts:      "Lead Submitted Successfully" on 201; "Submission Failed" on any
   *              other status code or thrown error (timeout / network failure).
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // ── Auth guard — must be logged in to submit ────────────────────────────
      if (!auth.currentUser) {
        addToast('Please login or register to submit a lead.', 'error');
        window.location.href = '/login';
        return;
      }

      // ── Client-side validation ──────────────────────────────────────────────
      const result = createLeadSchema.safeParse(fields);
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof LeadFormFields, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof LeadFormFields;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return; // do NOT call the API
      }

      // ── API submission ──────────────────────────────────────────────────────
      setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });

        if (response.status === 201) {
          addToast('Lead Submitted Successfully', 'success');
          setFields(INITIAL_FIELDS);
          setErrors({});
        } else {
          addToast('Submission Failed', 'error');
          // Preserve field values — do NOT reset
        }
      } catch {
        // Network error or AbortController timeout
        addToast('Submission Failed', 'error');
        // Preserve field values — do NOT reset
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [fields, addToast],
  );

  return { fields, errors, isLoading, handleChange, handleSubmit };
}
