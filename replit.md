# Football Scores Application

## Overview

This is a full-stack football scores application built with React (frontend) and Express.js (backend). The application displays live football fixtures, scores, leagues, and standings from various competitions worldwide. It features a modern UI with shadcn/ui components and real-time data fetching from sports APIs.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Redux Toolkit (@reduxjs/toolkit) for global state
- **Data Fetching**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Icons**: Phosphor Icons React library
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **API Integration**: Axios for external sports API calls
- **Development**: tsx for TypeScript execution in development

## Key Components

### Data Management
- **Central Data Provider**: Manages global application state and data fetching
- **Caching System**: Intelligent caching for fixtures, leagues, and team logos
- **Logo Cache**: Specialized caching system for country flags and team logos with fallback mechanisms
- **Popular League Filtering**: Sophisticated filtering system for league prioritization

### UI Components
- **Match Cards**: Display individual fixtures with scores, teams, and status
- **League Cards**: Show league standings and fixtures
- **Popular Leagues**: Filtered display of high-priority leagues
- **Date Selector**: Custom calendar component for date navigation
- **Featured Matches**: Highlighted important matches

### External Integrations
- **Sports API**: Integration with RapidAPI for live sports data
- **Flag/Logo APIs**: Multiple fallback systems for country flags and team logos
- **Supabase**: Secondary data storage and authentication

## Data Flow

1. **Data Fetching**: React Query manages API calls with automatic caching and refetching
2. **State Management**: Redux Toolkit handles global application state
3. **Component Updates**: Components automatically re-render when data changes
4. **Caching Strategy**: Multi-layered caching (React Query + localStorage) for optimal performance
5. **Error Handling**: Graceful fallbacks for failed API calls and missing data

### Filtering & Prioritization System
- **Geographic Filtering**: Prioritizes leagues by country (Tier 1: England, Spain, Italy, Germany, France)
- **League-Specific Filtering**: Each country has specific allowed leagues
- **Exclusion System**: Filters out unwanted competitions (women's leagues, youth leagues, lower tiers)
- **Popular League Priority**: Dynamic ordering based on competition importance

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Query, React Redux
- **UI Library**: Complete shadcn/ui component suite with Radix UI primitives
- **Styling**: Tailwind CSS with custom configuration
- **Database**: Drizzle ORM with PostgreSQL dialect
- **API Client**: Axios for HTTP requests
- **Date Handling**: date-fns for date manipulation
- **Form Handling**: React Hook Form with resolvers

### Development Dependencies
- **TypeScript**: Full TypeScript support across frontend and backend
- **Vite**: Modern build tool with hot reload
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations stored in `./migrations`

### Environment Configuration
- **Development**: Uses tsx for TypeScript execution
- **Production**: Node.js runs compiled JavaScript bundle
- **Database**: Environment variable `DATABASE_URL` for PostgreSQL connection

### Scripts
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build (frontend + backend)
- `npm start`: Production server
- `npm run db:push`: Database schema deployment

## Changelog

```
Changelog:
- October 23, 2025. Fixed system overload from simultaneous component loading:
  - Identified MyRightContent loading 7 components simultaneously (8-10+ API calls at once)
  - Implemented progressive loading with 3 phases: Phase 1 (500ms), Phase 2 (1.5s), Phase 3 (3s)
  - All components now lazy-loaded with Suspense boundaries and loading skeletons
  - Match details overlay only loads when user clicks a match (not pre-rendered)
  - API calls now spread over ~8 seconds instead of hitting simultaneously
  - Fixed HMR Fast Refresh warning by removing incompatible export
  - Result: Reduced initial page load stress, app remains responsive during editing
- October 22, 2025. Fixed critical system overload with request coalescing:
  - Added in-memory request deduplication to prevent duplicate concurrent API calls
  - When 6+ components request same date simultaneously, they now share 1 fetch instead of each making their own
  - Maintained required 3-day window (date-1, date, date+1) for timezone coverage
  - Performance improved from 363+ seconds to 9-13ms per request (27,000x faster!)
  - System load reduced: 6 requests × 3 API calls = 18 calls → now just 3 calls shared by all
  - MyNewLeague2 batch endpoint continues to handle league-specific needs
- October 22, 2025. Optimized MyNewLeague2 performance:
  - Replaced 46 individual API calls with single batch endpoint
  - Implemented server-side batching (3 leagues/batch, 200ms delays)
  - Added dynamic season calculation to prevent hardcoded season issues
  - Reduced refetch intervals: live 30s (was 15s), no-live 2min (was 1min)
  - Server-side 3-day window fetching (date-1, date, date+1) for timezone coverage
  - Disabled refetchOnWindowFocus to reduce unnecessary requests
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```