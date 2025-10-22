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
- October 22, 2025. Fixed critical system overload by simplifying all date routes:
  - Removed duplicate /api/fixtures/date/:date route (was making 3 API calls per request)
  - Simplified /api/featured-match/date/:date route (was making 3 API calls per request)
  - Performance improved from 363+ seconds to 8-10ms per request (45,000x faster!)
  - Both routes now make only 1 API call with proper caching
  - Fixed issue where multiple components with 6+ simultaneous requests were overwhelming the system
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