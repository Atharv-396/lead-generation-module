'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useLeadForm } from '@/hooks/useLeadForm';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { BUDGET_OPTIONS } from '@/types/lead';
import Link from 'next/link';

const budgetOptions = BUDGET_OPTIONS.map((v) => ({ value: v, label: v }));

export default function LeadForm() {
  const { fields, errors, isLoading, handleChange, handleSubmit } = useLeadForm();
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return unsub;
  }, []);

  // Still resolving auth state — render nothing to avoid flash
  if (currentUser === undefined) return null;

  return (
    <section id="lead-form" className="py-16 px-6 bg-white">
      <div className="mx-auto max-w-lg">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 text-center">Get in Touch</h2>
        <p className="mb-8 text-sm text-gray-500 text-center">
          Submit your details and we&apos;ll get back to you.
        </p>

        {/* Auth gate — shown when not logged in */}
        {!currentUser && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800">Login required</p>
              <p className="text-xs text-amber-600 mt-0.5">You must be logged in to submit a lead.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Login
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/register"
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            id="name"
            label="Name"
            type="text"
            value={fields.name}
            onChange={(v) => handleChange('name', v)}
            error={errors.name}
            required
            maxLength={100}
            placeholder="Your full name"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={fields.email}
            onChange={(v) => handleChange('email', v)}
            error={errors.email}
            required
            placeholder="you@example.com"
          />
          <Input
            id="budget"
            label="Budget Range"
            type="select"
            value={fields.budget}
            onChange={(v) => handleChange('budget', v)}
            error={errors.budget}
            required
            options={budgetOptions}
            placeholder="Select a budget range"
          />
          <Input
            id="message"
            label="Message"
            type="textarea"
            value={fields.message}
            onChange={(v) => handleChange('message', v)}
            error={errors.message}
            required
            maxLength={1000}
            placeholder="Tell us about your project..."
          />
          <Button type="submit" loading={isLoading}>
            {currentUser ? 'Submit' : 'Login to Submit'}
          </Button>
        </form>
      </div>
    </section>
  );
}
