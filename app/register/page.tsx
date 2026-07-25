'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useToastContext } from '@/contexts/ToastContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Link from 'next/link';

type Role = 'admin' | 'user';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToastContext();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // 1. Create user via API (Firebase Auth + save role to DB)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: name, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Account already exists — try signing in with the same credentials
          // (this happens when a previous register attempt created the Auth user
          // but failed before completing the session step)
          setErrors({ email: 'An account with this email already exists. Try logging in instead.' });
          return;
        }
        if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setErrors({ form: data.message ?? 'Registration failed' });
        }
        return;
      }

      // 2. Sign in with the new credentials to get a session cookie
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      addToast('Account created successfully!', 'success');

      // 3. Redirect based on role
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Registration failed';
      // Strip Firebase prefix for cleaner display
      const msg = raw.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/[^)]+\)\.?/, '').trim();
      setErrors({ form: msg });
      addToast('Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Create Account</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Choose your role to get started</p>

        {/* Role selector */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {(['user', 'admin'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                role === r
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{r === 'admin' ? '🛡️' : '👤'}</span>
              <span className="capitalize">{r}</span>
              <span className="text-xs font-normal text-gray-400">
                {r === 'admin' ? 'Manage leads' : 'Submit leads'}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="reg-name"
            label="Full Name"
            type="text"
            value={name}
            onChange={setName}
            required
            placeholder="Your full name"
            error={errors.displayName}
          />
          <Input
            id="reg-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="you@example.com"
            error={errors.email}
          />
          <Input
            id="reg-password"
            label="Password"
            type="text"
            value={password}
            onChange={setPassword}
            required
            placeholder="Min. 6 characters"
            error={errors.password}
          />

          {errors.form && (
            <p className="text-red-600 text-sm" role="alert">{errors.form}</p>
          )}

          <Button type="submit" loading={isLoading}>
            Create Account as {role === 'admin' ? 'Admin' : 'User'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
