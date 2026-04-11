# System Architecture

This document outlines the technical architecture and design decisions of the MicroSeed platform.

## Frontend Architecture

MicroSeed is built as a Single Page Application (SPA) using **React 19** and **Vite**.

### Component Structure
- **App.tsx**: The root component managing global state (user, settings, active business) and routing.
- **Views**: The application uses a state-based view system (`landing`, `assessment`, `dashboard`, `profile`, `admin`).
- **Hooks**: Custom hooks like `useInactivityLogout` handle cross-cutting concerns.
- **Services**: 
  - `gemini.ts`: Handles communication with the Google Generative AI SDK.
  - `notifications.ts`: Manages the creation of in-app notifications.
  - `auditLog.ts`: Records administrative actions.

## Backend & Data Persistence

The application uses **Firebase** for its backend services.

### Authentication
- **Google OAuth**: Primary authentication method.
- **Persistence**: Set to `browserSessionPersistence` for security.
- **User Profiles**: Automatically created/updated in Firestore upon login.

### Firestore Data Model
- `users`: User profiles, roles, and suspension status.
- `businesses`: Details about user-owned businesses.
- `assessments`: AI-generated results linked to businesses.
- `loans`: Loan applications and their lifecycle status.
- `notifications`: User-specific in-app alerts.
- `audit_logs`: Immutable records of administrative actions.
- `app_settings`: Global configuration (Maintenance Mode, Interest Rates).

### Security Rules
Firestore Security Rules enforce the "Least Privilege" principle:
- Users can only read/write their own data.
- Admins have elevated permissions for oversight.
- Suspended users are blocked from write operations.
- `app_settings` are publicly readable but only admin-writable.

## AI Integration

The **Gemini Pro** model is used to analyze business data.

- **Input**: Business name, industry, revenue, expenses, goals, and description.
- **Processing**: A structured prompt guides the AI to generate a JSON response.
- **Output**: 
  - Numerical score (0-100).
  - Potential rating (e.g., "High Growth").
  - Detailed SWOT analysis.
  - Specific recommendations.
  - Loan eligibility (amount and interest rate).

## Localization Strategy

The platform is localized for the Kenyan market:
- **Currency**: Defaulted to `KES` (Kenyan Shillings).
- **Formatting**: A global `currency.ts` utility handles symbol placement and decimal formatting.
- **Metrics**: Financial thresholds in the AI assessment are calibrated for the local economic context.

## Error Handling & Reliability

- **Firestore Error Handler**: A custom utility `handleFirestoreError` catches permission issues and logs detailed JSON context for debugging.
- **Rate Limiting**: Client-side rate limiting prevents abuse of the Gemini API and loan application system.
- **Error Boundaries**: React Error Boundaries catch runtime crashes and display user-friendly fallback UIs.
