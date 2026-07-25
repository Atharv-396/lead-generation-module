# LeadDesk Mini

## Project Overview

LeadDesk Mini is a production-quality full-stack CRM-style web application built with Next.js 15, TypeScript, Tailwind CSS v3, and Firebase. It provides a public-facing landing page with a lead capture form, a secure admin dashboard for managing submitted leads, and a complete REST API layer. The application is designed to look and feel like a real SaaS product — professional, responsive, accessible, and deployment-ready on Vercel.

## Features

- Public landing page with hero section, features showcase, and lead capture form
- Admin dashboard with search, status management, and skeleton loading states
- Firebase Auth with HttpOnly session cookies for secure server-side session verification
- REST API with Zod v4 schema validation (client- and server-side)
- Property-based and unit tests with fast-check and Vitest
- E2E tests with Playwright
- Accessible UI: semantic HTML, ARIA roles, visible focus indicators, keyboard navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Validation | Zod v4 |
| Unit Tests | Vitest + fast-check |
| E2E Tests | Playwright |

## Folder Structure

```
leaddesk-mini/
├── app/                    # Next.js App Router pages and API routes
│   ├── admin/              # Protected admin dashboard page
│   ├── api/
│   │   ├── leads/          # POST /api/leads, GET /api/leads
│   │   │   └── [id]/       # PATCH /api/leads/[id]
│   │   └── session/        # POST /api/session, POST /api/session/logout
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout (ToastProvider)
│   └── page.tsx            # Landing page
├── components/             # Reusable UI components
├── contexts/               # React context providers (ToastContext)
├── hooks/                  # Custom React hooks (useLeadForm, useLeads, useAuth, useToast)
├── lib/                    # Firebase init, Firestore helpers, env validation, Zod schemas
├── types/                  # Shared TypeScript types (Lead, Toast)
├── middleware.ts           # Auth route protection
├── e2e/                    # Playwright E2E tests (if present)
└── __tests__/              # Vitest unit and property-based tests
```

## Authentication Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Email/Password** authentication under Authentication → Sign-in method
3. Add an admin user via Authentication → Users in the Firebase console
4. Generate a service account key for the Admin SDK: Project Settings → Service Accounts → Generate new private key
5. Copy `.env.example` to `.env.local` and fill in all values (see [Environment Variables](#environment-variables))

## Database Design

Firestore `leads` collection:

| Field | Type | Notes |
|---|---|---|
| id | string | Auto-generated document ID, also stored as a field |
| name | string | 3–100 characters |
| email | string | Valid email format |
| budget | string | One of the four budget options |
| message | string | 10–1000 characters |
| status | string | `New` / `Contacted` / `Closed` |
| createdAt | Timestamp | Set via `serverTimestamp()` on creation |
| updatedAt | Timestamp | Set via `serverTimestamp()` on creation and each update |

Budget options: `Under ₹10,000`, `₹10,000 – ₹25,000`, `₹25,000 – ₹50,000`, `₹50,000+`

## API Endpoints

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/leads` | No | Create a new lead (validates with Zod, returns 201 + Lead) |
| `GET` | `/api/leads` | No | Get all leads ordered by `createdAt` descending |
| `PATCH` | `/api/leads/[id]` | No | Update lead status (returns 200 + updated Lead, or 404 if not found) |
| `POST` | `/api/session` | No | Exchange Firebase ID token for an HttpOnly session cookie |
| `POST` | `/api/session/logout` | No | Clear the session cookie |

All error responses follow the shape `{ "field"?: string, "message": string }`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase app ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Server | Admin SDK project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server | Admin SDK service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server | Admin SDK private key (include full PEM with `\n` line breaks) |
| `FIREBASE_SESSION_SECRET` | Server | 32+ random bytes for session cookie signing |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Installation Instructions

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# 3. Run development server
npm run dev

# 4. Run unit and property-based tests
npm test

# 5. Run E2E tests (requires a running dev server on port 3000)
npm run test:e2e
```

## Deployment Guidance

This app is designed for Vercel deployment:

1. Push your code to a GitHub repository
2. Import the repository in the [Vercel dashboard](https://vercel.com/new)
3. Under **Environment Variables**, add every key from `.env.example` with your real values
4. Deploy — Vercel runs `next build` automatically on each push

All API routes use the Node.js runtime (not Edge), which is required by the Firebase Admin SDK. No configuration changes are needed for Vercel to handle this correctly.
