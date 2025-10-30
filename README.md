# Smart Fridge Recipe Recommendation System - Frontend

A modern web application that connects to a smart fridge sensor system to provide personalized recipe recommendations for Hong Kong families.

## Overview

This frontend application works with a backend sensor system that tracks fridge inventory in real-time. The app provides personalized recipe recommendations based on available ingredients, family member preferences, dietary restrictions, and cuisine preferences.

## Features

### Family Management
- Multi-member family setup with individual profiles
- Dietary restrictions and allergy tracking
- Health condition considerations
- Personalized preferences per family member

### Smart Inventory Integration
- Real-time fridge inventory from backend sensor
- Initial fridge setup and calibration
- Automatic ingredient tracking

### Recipe Recommendations
- AI-powered recipe suggestions using GPT
- Cuisine preference selection (Chinese, Western, Japanese, etc.)
- Dietary restriction filtering
- Ingredient availability matching
- Hong Kong time zone aware meal suggestions

### User Experience
- Mobile-first responsive design
- Traditional Chinese and English support
- Touch-optimized interface
- Offline recipe viewing

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + useReducer
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns (HKT support)
- **Build Tool**: Vite
- **Code Quality**: ESLint + Prettier

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI elements (Button, Input, etc.)
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── pages/               # Page components
│   ├── onboarding/      # Family setup flow
│   ├── dashboard/       # Main app dashboard
│   └── recipes/         # Recipe related pages
├── hooks/               # Custom React hooks
├── services/            # API services and external integrations
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── styles/              # Global styles and Tailwind config
└── constants/           # App constants and configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend sensor system running

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ISDN-Group8-FYP
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Environment Variables

```
VITE_API_BASE_URL=http://localhost:8000
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_APP_TIMEZONE=Asia/Hong_Kong
```

## API Integration

The frontend communicates with the backend sensor system through REST APIs:

- `GET /api/inventory/current` - Get current fridge inventory
- `POST /api/inventory/initialize` - Initialize fridge setup
- `POST /api/family/setup` - Save family configuration
- `POST /api/recipes/generate` - Generate recipe recommendations

## Development Guidelines

- Follow TypeScript strict mode
- Use functional components with hooks
- Implement proper error boundaries
- Write responsive, mobile-first CSS
- Use semantic HTML elements
- Follow accessibility best practices

## Contributing

1. Create feature branch from `frontend`
2. Follow existing code style and patterns
3. Write clean, production-ready code
4. Test on mobile devices
5. Submit pull request

## License

MIT License - see LICENSE file for details