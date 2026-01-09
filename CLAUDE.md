# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DMDL Provider Locator is a geolocation-based check-in/check-out system for educational service providers. Providers check-in at assigned school locations within 150m radius; administrators manage providers, schools, schedules, and reports.

## Current Status

**Production-ready** - All core features implemented and tested.

- 200 tests passing (shared: 75, mobile: 57, functions: 68)
- TypeScript strict mode passes across all packages
- Static export configured for Firebase Hosting
- EAS builds configured for mobile distribution

## Development Commands

```bash
# Install dependencies (from root)
npm install

# Development
npm run dev:mobile          # Expo mobile app
npm run dev:web             # Next.js admin portal

# Build
npm run build:shared        # Must build first - other packages depend on it
npm run build:web
npm run build:functions

# Quality checks
npm run lint                # ESLint across all workspaces
npm run typecheck           # TypeScript across all workspaces
npm run test                # Jest tests across all workspaces

# Firebase
npm run deploy:functions    # Deploy Cloud Functions
npm run deploy:hosting      # Deploy web app
firebase emulators:start    # Local Firebase emulators
```

### Running Individual Workspaces

```bash
cd mobile && npm run ios    # Run on iOS simulator
cd mobile && npm run android # Run on Android emulator
cd functions && npm run serve # Functions with emulator
```

## Architecture

### Monorepo Structure (npm workspaces + Turbo)

- **mobile/** - Expo React Native app with Expo Router (file-based routing)
- **web/** - Next.js 16 admin portal with App Router, Tailwind + shadcn/ui
- **functions/** - Firebase Cloud Functions (TypeScript)
- **shared/** - Types, constants, and utilities used across all apps (`@dmdl/shared`)

### Key Patterns

**Authentication Flow**: Microsoft Entra ID OAuth → Firebase Auth → Firestore user document. Mobile uses PKCE flow; web uses redirect flow.

**State Management**: React Context API (not Redux). Three contexts in mobile: `AuthContext`, `LocationContext`, `SessionContext`. Custom hooks manage Firestore queries.

**Firestore Collections**: `USERS`, `SCHOOLS`, `SCHEDULES`, `ASSIGNMENTS`, `SESSIONS`, `LOCATION_CHECKS` (defined in `shared/src/constants/index.ts`)

**Cloud Functions**: Callable functions with type-safe signatures. Location validation is server-side only (prevents spoofing). Key functions:
- `signInWithMicrosoft` - Entra ID token verification, user creation, custom token generation
- `checkIn` - Validate location within radius, validate provider schedule, create session
- `checkOut` - Complete session with duration calculation
- `updateSessionNotes` - Update notes with permission checks (1000 char limit)
- `generateSessionReport` - CSV export with date/provider/school filters
- `autoCheckOutStale` - Scheduled function (every 15 min) for 12-hour auto-checkout

**Geolocation**: 150m check-in radius, distance calculated server-side using Haversine formula. Mobile uses `expo-location` with background fetch for auto-checkout detection.

### Navigation

Mobile (Expo Router):
- `(tabs)/` - Main tab navigation (Schools, History, Profile)
- `(auth)/` - Login flow
- `school/[id]` - School detail with check-in
- `session/[id]` - Session detail

Web (Next.js App Router):
- `(dashboard)/` - Protected admin routes (providers, schools, schedules, sessions, reports, import)
- `/login` - Authentication

## Constants

Check-in radius: `CHECK_IN_RADIUS_METERS = 150`
Auto-checkout: `AUTO_CHECKOUT_HOURS = 12`
Background location interval: 5 minutes

## Environment Variables

Required in `.env` (mobile), `.env.local` (web):
- Firebase config (API key, auth domain, project ID, etc.)
- Entra ID credentials (Tenant ID, Client ID)

## Dependencies

- Build order: `shared` must be built before other packages (Turbo handles this via `^build`)
- Path alias: Import shared types via `@dmdl/shared`
- Node.js 20+ required

## Shared Package (`@dmdl/shared`)

**Types**: `User`, `School`, `Session`, `ScheduleSlot`, `GeoPoint`, `Assignment`

**Utilities**:
- `calculateDistance()` / `calculateDistanceBetweenPoints()` - Haversine formula
- `isWithinRadius()` / `isWithinSchoolRadius()` - Distance validation
- `formatDistance()` - "150m" or "1.5km" formatting
- `formatDuration()` - "2h 30m" formatting
- `generateGeohash()` - Geospatial hashing

## Firestore

**Indexes** (7 custom indexes in `firestore.indexes.json`):
- Schools: `(isActive, name)`
- Users: `(role, displayName)`
- Schedules: Multiple indexes for day/time/provider queries
- Sessions: `(userId, checkInTime)`, `(status, checkInTime)`

**Security Rules**: Role-based access control. Providers access own sessions only; admins have full access.
