# LearnLens Frontend

Next.js frontend for the LearnLens AI-powered tutoring app.

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

# Google OAuth Client ID (from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
7. Add authorized redirect URIs:
   - `http://localhost:3000`
8. Copy the **Client ID** to your `.env.local` file

### 4. Start Development Server

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
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── dashboard/
│   │   └── page.tsx       # Dashboard page
│   └── material/[id]/
│       └── page.tsx       # Material detail page
├── components/             # Reusable components
│   ├── Sidebar.tsx
│   ├── ChatPanel.tsx
│   ├── MaterialUpload.tsx
│   ├── QuizPanel.tsx
│   ├── SummaryPanel.tsx
│   └── GoogleLoginButton.tsx
└── lib/
    ├── api.ts             # API client
    └── auth-context.tsx   # Auth state management
```

## ✨ Features

- 🔐 Google OAuth authentication
- 📄 Upload learning materials (PDF or text)
- 💬 Chat with AI tutor
- 📝 AI-generated summaries
- ❓ Interactive quizzes
- 🌙 Dark mode support
- 📱 Responsive design

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
