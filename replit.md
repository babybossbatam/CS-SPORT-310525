# CSSPORT - Football Scores Application

## Overview

CSSPORT is a comprehensive football scores and statistics application that provides real-time match data, league standings, news, and match analytics. The application follows a modern full-stack architecture with React frontend, Express backend, and PostgreSQL database, designed to deliver live football data from multiple sports APIs.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: Redux Toolkit for global state
- **Data Fetching**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Integration**: Multiple sports data providers (RapidAPI, SportsRadar, BetsAPI)
- **Authentication**: Supabase integration for user management

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle migrations with versioned schema files
- **Caching Strategy**: Database-level caching for fixtures, leagues, and news articles

## Key Components

### Data Sources
1. **RapidAPI Football Service**: Primary data source for fixtures, leagues, and standings
2. **SportsRadar API**: Secondary data source for enhanced statistics
3. **BetsAPI**: News articles and additional match information
4. **Supabase**: User authentication and profile management

### Core Data Models
- **Users**: Authentication and user preferences
- **UserPreferences**: Favorite teams, leagues, and notification settings
- **CachedFixtures**: Cached match data with intelligent refresh strategies
- **CachedLeagues**: League information and metadata
- **NewsArticles**: Football news and updates

### Frontend Components
- **Match Display**: Real-time match cards with live score updates
- **League Management**: Detailed league standings and fixture lists
- **Live Data**: Auto-refreshing live match components
- **User Dashboard**: Personalized favorite teams and matches
- **News Integration**: Football news with filtering capabilities

## Data Flow

### Real-time Updates
1. **Live Matches**: 30-second refresh intervals for active matches
2. **Fixture Updates**: Smart caching with different refresh rates based on match status
3. **League Data**: 2-hour cache for relatively static league information
4. **News Articles**: Periodic refresh with database persistence

### Cache Strategy
- **Live Data**: 15-second cache for active matches
- **Today's Fixtures**: 1-hour cache duration
- **Future Fixtures**: 12-hour cache (schedules rarely change)
- **Historical Data**: 7-day cache for completed matches
- **Static Data**: 2-hour cache for leagues and teams

### API Rate Limiting
- Intelligent request throttling to respect API limits
- Fallback mechanisms between multiple data providers
- Local caching to minimize redundant API calls

## External Dependencies

### Sports Data APIs
- **API-Football (RapidAPI)**: Primary fixture and league data
- **SportsRadar**: Enhanced statistics and alternative data source
- **BetsAPI**: News articles and supplementary match information

### Infrastructure Services
- **Supabase**: User authentication and profile storage
- **Neon PostgreSQL**: Serverless database hosting
- **Replit**: Development and deployment platform

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Comprehensive icon library
- **Date-fns**: Date manipulation and formatting
- **React Hook Form**: Form validation and management

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with instant updates
- **Database**: Local PostgreSQL with Drizzle migrations
- **Environment Variables**: Secure API key management
- **Error Handling**: Comprehensive error boundaries and logging

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: esbuild compilation for Node.js deployment
- **Database**: Neon serverless PostgreSQL
- **Monitoring**: Global error handlers and performance tracking

### Performance Optimizations
- **Code Splitting**: Lazy-loaded route components
- **Asset Optimization**: Compressed images and fonts
- **API Efficiency**: Batched requests and intelligent caching
- **Bundle Analysis**: Tree-shaking and minimal dependencies

## Changelog
- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.