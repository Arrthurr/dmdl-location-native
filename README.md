# DMDL Provider Locator

A mobile + web application for educational service providers to check-in and check-out of school locations using geolocation.

## Overview

This application enables:
- **Providers** to check-in/out at assigned school locations within a 150m radius
- **Administrators** to manage providers, schools, schedules, and generate reports

## Tech Stack

- **Mobile App**: Expo (React Native) with Expo Router
- **Web App**: Next.js 16 with Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Cloud Functions, Hosting)
- **Authentication**: Microsoft Entra ID (Azure AD)

## Project Structure

```
dmdl-location-native/
├── mobile/                 # Expo React Native app
├── web/                    # Next.js admin portal
├── functions/              # Firebase Cloud Functions
├── shared/                 # Shared types and utilities
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
└── firestore.indexes.json  # Firestore indexes
```

## Prerequisites

- Node.js 20+
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

## Setup

### 1. Clone and Install Dependencies

```bash
cd dmdl-location-native
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Microsoft provider
3. Enable Firestore Database
4. Copy your Firebase config to `.env` files (see `.env.example`)

```bash
# Update .firebaserc with your project ID
firebase login
firebase use your-project-id
```

### 3. Microsoft Entra ID Setup

1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App registrations
2. Create a new registration or use existing
3. Add redirect URIs:
   - Web: `https://your-project-id.firebaseapp.com/__/auth/handler`
   - Mobile: `dmdl-locator://auth`
4. Copy Tenant ID and Client ID to `.env` files

### 4. Environment Variables

Create `.env` files in the root, `/mobile`, and `/web` directories:

```bash
cp .env.example .env
cp .env.example mobile/.env
cp .env.example web/.env.local
```

Update with your Firebase and Entra ID credentials.

### 5. Deploy Firebase Rules and Functions

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
npm run deploy:functions
```

## Development

### Run All Apps

```bash
# Mobile app
npm run dev:mobile

# Web app
npm run dev:web

# Firebase emulators (optional)
firebase emulators:start
```

### Run Individual Apps

```bash
# Mobile
cd mobile && npm start

# Web
cd web && npm run dev

# Functions (with emulator)
cd functions && npm run serve
```

## Features

### Mobile App (Providers & Admins)
- Microsoft sign-in
- View assigned schools with distance
- Geolocation-based check-in/out (150m radius)
- Session timer and notes
- Check-in history
- Background location for auto-checkout

### Web App (Administrators)
- Microsoft sign-in
- Dashboard with active sessions
- CRUD for Providers, Schools, Schedules
- Session history and reporting
- CSV export
- Data import

## Cloud Functions

- `checkIn` - Validate location and create session
- `checkOut` - Complete session with duration
- `updateSessionNotes` - Update session notes
- `autoCheckOutStale` - Auto-checkout after 12 hours (scheduled)
- `generateSessionReport` - Generate CSV reports

## Security

- Firebase Auth with Microsoft Entra ID
- Role-based access (provider vs administrator)
- Firestore security rules
- Location validation server-side

## License

Private - DMDL
