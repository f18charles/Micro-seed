# MicroSeed

Empowering small businesses with AI-driven potential assessment and microloan opportunities.

## Overview

MicroSeed is a full-stack microfinance platform designed to bridge the gap between small business owners and capital. By leveraging the Gemini AI API, the platform provides instant business potential assessments, helping entrepreneurs understand their strengths and weaknesses while determining loan eligibility.

## Key Features

- **AI-Powered Assessment**: Get instant analysis of your business health and growth potential using Google's Gemini Pro.
- **Microloan Pipeline**: Seamless application process with real-time status tracking (Pending, Approved, Disbursed, Repaid).
- **Comprehensive Admin Panel**: Full oversight for platform administrators to manage loans, users, and global settings.
- **Localized for Kenya**: Default currency set to Kenyan Shillings (KES) with localized financial metrics.
- **Security First**: Robust Firestore security rules, audit logging for administrative actions, and rate-limiting for sensitive operations.
- **Maintenance Mode**: Ability for admins to toggle platform-wide maintenance mode with custom messaging.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **State Management**: React Hooks (useState, useEffect)
- **UI Components**: shadcn/ui, Lucide React, Framer Motion
- **Backend**: Firebase (Authentication, Firestore)
- **AI**: Google Gemini API (@google/genai)
- **Charts**: Recharts
- **Notifications**: Sonner (Toasts), Custom Firestore-based notification system

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Project
- Google Gemini API Key

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Ensure `firebase-applet-config.json` is present in the root with your Firebase configuration.

### Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

- `src/components`: Reusable UI components and page sections.
- `src/components/admin`: Administrative dashboard modules.
- `src/services`: Integration logic for Gemini AI and Firebase.
- `src/lib`: Utility functions, rate limiters, and currency configurations.
- `src/firebase.ts`: Firebase initialization and custom error handlers.
- `firestore.rules`: Security rules for database access.
