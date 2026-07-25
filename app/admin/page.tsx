'use client';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import AdminTable from '@/components/AdminTable';
import SearchInput from '@/components/SearchInput';
import Button from '@/components/Button';

export default function AdminPage() {
  const { filteredLeads, isLoading, error, searchQuery, setSearchQuery, updateStatus, retry } = useLeads();
  const { signOut, user } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header row with title and sign out */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
            {user && (
              <p className="text-sm text-gray-500 mt-0.5">
                Signed in as <span className="font-medium">{user.displayName ?? user.email}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
            <p className="text-sm text-red-700">Could not load leads. Try again.</p>
            <Button variant="secondary" onClick={retry}>Retry</Button>
          </div>
        ) : null}

        <div className="mb-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
        </div>

        <AdminTable leads={filteredLeads} isLoading={isLoading} onStatusChange={updateStatus} />
      </div>
    </main>
  );
}
