# MicroSeed: Empowering Emerging Markets with AI-Driven Microfinance

MicroSeed is a next-generation microloan application designed for small businesses in emerging markets, specifically localized for Kenya. It uses Google's Gemini AI to assess business potential beyond traditional credit scores, providing capital to the "Next Billion" businesses.

## Key Features

- **AI Business Assessment**: Leverages Gemini AI to analyze business models, industry trends, and growth goals.
- **Localized for Kenya**: Default currency set to KES (KSh) with support for M-PESA statement analysis.
- **Fraud Detection**: Integrated AI-powered fraud checks for loan applications.
- **Real-time Notifications**: In-app notifications for loan status updates, repayments, and assessments.
- **Guarantor System**: Digital guarantor invitation and consent workflow.
- **Admin Dashboard**: Comprehensive management of users, loans, documents, and system settings.

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Firebase (Authentication, Firestore, Storage).
- **AI**: Google Gemini API (@google/genai).
- **Animations**: Framer Motion.
- **Charts**: Recharts.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Project
- Google Gemini API Key

### Environment Variables

Create a `.env` file in the root directory and add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Documentation

- [Admin Guide](./ADMIN_GUIDE.md): How to access and use the admin panel.
- [Localization](./LOCALIZATION.md): Details on KES currency and Kenyan market adaptations.
- [Security Rules](./firestore.rules): Firestore security configuration.

## License

MIT
