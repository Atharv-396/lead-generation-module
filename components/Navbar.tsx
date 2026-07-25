'use client';

import { useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return unsub;
  }, []);

  const linkClass =
    'text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded';

  return (
    <nav
      aria-label="Main navigation"
      className="bg-white shadow-sm px-6 py-4 flex items-center justify-between relative"
    >
      {/* Brand */}
      <Link
        href="/"
        className="text-xl font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      >
        LeadDesk Mini
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6">
        <a href="#features" className={linkClass}>Features</a>
        <a href="#lead-form" className={linkClass}>Contact</a>

        {/* Auth section */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 max-w-[150px] truncate">
              {currentUser.displayName ?? currentUser.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 rounded"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center p-2 rounded text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-[72px] left-0 right-0 bg-white shadow-md border-t border-gray-100 flex flex-col px-6 py-4 gap-4 md:hidden z-10"
        >
          <a href="#features" className={linkClass} onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#lead-form" className={linkClass} onClick={() => setMenuOpen(false)}>Contact</a>

          {currentUser ? (
            <>
              <span className="text-sm text-gray-500 truncate">{currentUser.displayName ?? currentUser.email}</span>
              <button
                type="button"
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="text-left text-sm font-medium text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
