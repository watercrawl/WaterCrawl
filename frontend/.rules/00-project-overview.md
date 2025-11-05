# WaterCrawl Frontend - Project Overview

## Project Description
WaterCrawl is a comprehensive web crawling platform with intelligent data extraction and LLM integration capabilities. The frontend is a React-based single-page application that provides an intuitive interface for web crawling, search, sitemap generation, and knowledge base management.

## Tech Stack

### Core
- **React 18.3.1** - UI framework
- **TypeScript 5.6.3** - Type safety
- **Vite** - Build tool and dev server
- **pnpm** - Package manager (prefer over npm/yarn)

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Custom Design System** - Semantic color tokens
- **Headless UI** - Accessible UI components
- **Heroicons & Lucide React** - Icon libraries

### Forms & Validation
- **React Hook Form 7.58.1** - Form management
- **Yup** - Schema validation

### State Management
- **React Context API** - Global state
- **Contexts**: ThemeContext, UserContext, TeamContext, SettingsContext, BreadcrumbContext, ConfirmContext

### Routing
- **React Router 7.6.2** - Client-side routing with nested routes

### HTTP & API
- **Axios 1.10.0** - HTTP client
- **Centralized API services** in `/src/services/api/`

### Internationalization
- **i18next** - Translation framework
- **10 supported languages**: English, German, Arabic, Spanish, French, Italian, Persian/Farsi, Japanese, Portuguese, Chinese

### Authentication
- **JWT tokens** - Auth mechanism
- **Auth0 React** - OAuth integration (GitHub, Google)

### UI Enhancements
- **React Hot Toast** - Notifications
- **Monaco Editor** - Code editor
- **Recharts 2.15.4** - Data visualization

## Project Structure

```
frontend/
├── public/
│   └── locales/          # Translation files (10 languages)
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── shared/       # 36+ common components
│   │   ├── auth/         # Authentication components
│   │   ├── crawl/        # Crawling-related components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── forms/        # Form components
│   │   ├── json-forms/   # Dynamic form generation
│   │   ├── knowledge/    # Knowledge base components
│   │   ├── search/       # Search components
│   │   ├── settings/     # Settings components
│   │   └── sitemap/      # Sitemap components
│   ├── contexts/         # React contexts (5 total)
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Page layouts (4 total)
│   ├── pages/            # Page components (48 total)
│   ├── services/         # API services (20+ modules)
│   ├── types/            # TypeScript definitions (16 files)
│   ├── utils/            # Utility functions
│   └── App.tsx           # Root component
└── .rules/               # AI coding rules (this directory)
```

## Key Features
1. **Web Crawling** - Single and batch URL crawling with customizable options
2. **Smart Search** - Web search with depth control
3. **Sitemap Generation** - Automatic sitemap creation
4. **Knowledge Base** - Document management with embeddings and semantic search
5. **API Integration** - RESTful API with interactive documentation
6. **Multi-language Support** - Full i18n support for 10 languages
7. **Team Management** - Multi-user collaboration
8. **Subscription Management** - Stripe integration
9. **Theme Support** - Light/dark mode with system preference detection

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Environment Variables
See `.env.example` for required environment variables including:
- `VITE_API_URL` - Backend API URL
- OAuth credentials
- Stripe keys (if applicable)
