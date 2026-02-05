# Pandora Box

A social network of ideas connecting problems with solutions through AI-driven association and business analysis. Pandora Box transforms raw thoughts into structured innovations, bridging the gap between intuition and actionable business roadmaps.

**🌐 Live Application:** [https://pandora-box-81137998792.us-west1.run.app/](https://pandora-box-81137998792.us-west1.run.app/)

## Overview

Pandora Box is a neural social network where ideas aren't just static posts—they're living nodes that intelligently relate to one another. The platform helps bridge the gap between visionaries who have problems they can't articulate technically and engineers who have solutions looking for a problem.

## Key Features

### 🤖 AI Writing Assistant

Converts informal thoughts and vents into professional, structured "Idea Nodes" with technical tags using Google Gemini AI.

### 🔨 The Forge

An AI-powered co-founder that generates comprehensive business analysis including:

- SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
- Business Model Canvas (Value Proposition, Customer Segments, Revenue Streams, Cost Structure)
- Veracity Score for scientific plausibility validation
- Viability, Market Size, and Complexity scoring
- Competitor analysis
- Suggested team composition
- Interactive flowcharts via Mermaid.js diagrams

### 🎨 Multimodal Creation

- Upload photos of hand-drawn prototypes for AI analysis
- Voice input for real-time idea capture
- Image and video attachments for richer idea presentation

### 🌐 The Network

- Connect problems directly with solutions
- "Echo" system for idea validation (upvoting)
- Collaborative contribution system
- Real-time notifications for interactions
- Multi-language support (English, Portuguese, Spanish)

### 👥 User Features

- Personal profiles with progress tracking
- Favorite ideas collection
- Activity tracking (views, echoes, comments)
- Achievement system with levels and rewards
- Company/team collaboration features

## Technology Stack

- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS with custom "Obsidian" theme
- **AI Engine:** Google Gemini API (Gemini 3 Pro and Flash models)
- **Backend:** Firebase Firestore for real-time data synchronization
- **Visualization:** Recharts for analytics, Mermaid.js for flowcharts
- **Icons:** Lucide React
- **Build Tool:** Vite

## Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API key

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/pandora-box.git
   cd pandora-box
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create or edit the `.env.local` file and add the following variables:

   ```
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**

   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

```
pandora-box/
├── components/           # React components
│   ├── AuthModal.tsx
│   ├── BusinessAnalyzer.tsx
│   ├── CheckoutModal.tsx
│   ├── CompanyDashboard.tsx
│   ├── CreateIdeaModal.tsx
│   ├── IdeaCard.tsx
│   ├── IdeaDetail.tsx
│   ├── ProPlanPage.tsx
│   └── UserProfile.tsx
├── contexts/            # React contexts
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── services/            # Service layer
│   ├── backend.ts
│   ├── firebase.ts
│   └── geminiService.ts
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
├── locales.ts          # Internationalization strings
└── vite.config.ts      # Vite configuration
```

## Features in Detail

### Idea Types

- **Problems:** User-identified challenges looking for solutions
- **Solutions:** Proposed answers to existing problems

### AI-Powered Business Analysis

The Forge uses Google Gemini to analyze ideas and generate:

- Viability scores (0-100)
- Market size assessment
- Complexity evaluation
- Scientific veracity validation
- Strategic business insights
- Visual flowcharts showing business logic

### Social Interactions

- **Echoes:** Upvote mechanism to validate ideas
- **Favorites:** Save ideas for later reference
- **Comments:** Engage in discussions
- **Contributors:** Collaborate on ideas
- **Notifications:** Stay updated on interactions

### User Progression

Users advance through levels by:

- Creating quality ideas
- Receiving echoes
- Contributing to other ideas
- Engaging with the community

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Google Gemini AI
