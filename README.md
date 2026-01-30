# LearnLens Frontend

Next.js frontend for the LearnLens AI-powered tutoring app.

## 🛠 Tech Stack

- **Framework**: Next.js 16
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Visualization**: xyflow/react (Mind Maps)
- **Icons**: Lucide React
- **Authentication**: NextAuth.js
- **PDF Parsing**: pdf-parse

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚠️ Important

Make sure the backend is running first! The frontend communicates with the backend API for all data and AI operations.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # User dashboard
│   ├── explore/            # Community explore page
│   └── material/[id]/      # Study material interface
├── components/             # Reusable UI components
│   ├── ui/                 # Basic UI elements
│   ├── visuals/            # Mind maps & visualizations
│   └── features/           # Feature-specific components
└── lib/
    ├── api.ts              # Backend API integration
    └── utils.ts            # Helper functions
```

## ✨ Features

- **AI Tutoring**: Chat with context-aware AI based on your materials.
- **Smart Summaries**: Auto-generated summaries of complex documents.
- **Mind Maps**: Visualize concepts using interactive node graphs.
- **Quiz Mode**: Test your knowledge with AI-generated quizzes.
- **Social Sharing**: Publish and explore study materials from the community.
- **PDF Reports**: Export study progress and summaries to PDF.
- **Dark Mode**: Sleek UI with full dark mode support.

## 📝 Available Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run start`: Start production server.
- `npm run lint`: Run ESLint.
