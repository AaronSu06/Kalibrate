# Kalibrate

Voice-first accessibility platform for Kingston, Ontario services.

## Overview

Kalibrate helps newcomers, seniors, and non-native English speakers easily find essential services in Kingston, Ontario. Users can visually explore services on an interactive map or use voice/chat to ask questions naturally.

## Features

- **Interactive Map**: Mapbox-powered map centered on Kingston with color-coded service markers
- **Category Filtering**: Filter services by healthcare, groceries, banks, and pharmacies
- **Voice Assistant**: Chatbot interface with voice and text input (stubbed for Phase 1)
- **Accessible Design**: WCAG AA compliant with screen reader support, keyboard navigation, and high contrast mode
- **Responsive**: Works on desktop and mobile with simple stacked layout

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Map**: Mapbox GL JS
- **Voice/Chat**: AWS Transcribe + Lex V2 (stubbed for Phase 1)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Mapbox access token (get free token at [mapbox.com](https://account.mapbox.com/access-tokens/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd JARVIS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Mapbox token:
   ```
   VITE_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Optional (for Phase 2)
VITE_AWS_REGION=us-east-1
VITE_AWS_TRANSCRIBE_LANGUAGE=en-US
VITE_AWS_LEX_BOT_ID=stub
VITE_AWS_LEX_BOT_ALIAS_ID=stub
```

## Project Structure

```
/
├── src/
│   ├── components/         # React components
│   │   ├── CategoryList.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Map.tsx
│   │   ├── ChatbotModal.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useVoiceInput.ts
│   │   └── useServiceFilter.ts
│   ├── services/          # External service integrations
│   │   ├── mapService.ts
│   │   ├── awsTranscribe.ts (stub)
│   │   └── awsLex.ts (stub)
│   ├── data/              # Hardcoded service data
│   │   └── services.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

## Current Services (Phase 1)

The MVP includes 7 hardcoded Kingston locations:

**Healthcare** (2)
- Kingston General Hospital
- Hotel Dieu Hospital

**Groceries** (2)
- Metro - Princess Street
- FreshCo Kingston Centre

**Banking** (2)
- RBC Royal Bank - Princess
- TD Canada Trust - Bath Road

**Pharmacy** (1)
- Shoppers Drug Mart - Princess

## Accessibility Features

- ✅ WCAG AA compliant
- ✅ Keyboard navigation (Tab, Enter, Space, Esc)
- ✅ Screen reader support with ARIA labels
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Touch targets ≥48px
- ✅ Focus indicators for all interactive elements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Note: Voice input requires HTTPS in production (localhost works for development).

## Troubleshooting

### Map doesn't load

1. Verify your Mapbox token in `.env`
2. Restart dev server after changing `.env`
3. Check browser console for errors
4. Ensure token has correct permissions in Mapbox dashboard

### TypeScript errors

```bash
npm run type-check
```

If errors persist, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails

Ensure all dependencies are installed:
```bash
npm install
```

Check for TypeScript errors:
```bash
npm run type-check
```

## Phase 2 Roadmap

- [ ] Implement real AWS Transcribe streaming
- [ ] Implement AWS Lex V2 chatbot
- [ ] Add AWS Lambda backend
- [ ] Scrape live Kingston data (transit, 311)
- [ ] Multilingual support (French, Arabic, Mandarin)
- [ ] User authentication
- [ ] Service reviews and ratings
- [ ] Mobile app (React Native)

## Contributing

This is an MVP project. Contributions welcome for Phase 2 features!

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
