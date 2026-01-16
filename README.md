# Kalibrate

Voice-first accessibility platform for Kingston, Ontario services.

## Overview

Kalibrate helps newcomers, seniors, and non-native English speakers easily find essential services in Kingston, Ontario.

## Features

- **Interactive Map**: Mapbox-powered map centered on Kingston with color-coded service markers
- **Category Filtering**: Filter services by healthcare, groceries, banks, and pharmacies
- **Voice Assistant**: Chatbot interface with voice and text input (stubbed for Phase 1)
- **Accessible Design**: WCAG AA compliant with screen reader support, keyboard navigation, and high contrast mode

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Map**: Mapbox GL JS
- **Voice/Chat**: Web Speech API + AWS Lex V2 (stubbed for Phase 1)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Mapbox access token (get free token at [mapbox.com](https://account.mapbox.com/access-tokens/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Kalibrate
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
VITE_AWS_REGION=us-east-1
VITE_AWS_TRANSCRIBE_LANGUAGE=en-US
VITE_AWS_LEX_BOT_ID=stub
VITE_AWS_LEX_BOT_ALIAS_ID=stub
VITE_SPEECH_LANGUAGES=your_web_speech_token_here
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
