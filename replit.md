# CSSPORT - Sports Data Application

## Overview
CSSPORT is a comprehensive sports data application that provides live scores, fixtures, standings, and news for multiple sports, with a primary focus on football (soccer). The application uses a modern web stack with real-time data fetching from multiple sports APIs to deliver up-to-date sports information.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Bundling**: Vite for fast development and optimized production builds
- **State Management**: Redux Toolkit for centralized state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: TailwindCSS with shadcn/ui component library
- **Data Fetching**: TanStack Query (React Query) for server state management with caching

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Integration**: Multiple sports data providers (RapidAPI, SportsRadar, BetsAPI)
- **Development**: TypeScript with tsx for development server

## Key Components

### Data Layer
- **Database Schema**: PostgreSQL with tables for users, user preferences, cached fixtures, cached leagues, and news articles
- **Caching Strategy**: Multi-tiered caching system with different durations for live data (15 seconds), today's data (1 hour), future data (12 hours), and past data (7 days)
- **Data Providers**: Integration with multiple sports APIs for comprehensive data coverage

### User Interface
- **Match Display**: Interactive match cards with star functionality for favoriting
- **Live Updates**: Real-time score updates with visual indicators for match status
- **League Navigation**: Comprehensive league standings and fixture displays
- **Multi-Sport Support**: Dedicated pages for football, basketball, baseball, tennis, and hockey

### Authentication System
- **User Management**: Registration and login functionality
- **Preferences**: User-specific favorite teams, leagues, and match tracking
- **Supabase Integration**: External authentication provider for user management

## Data Flow

1. **API Data Ingestion**: Multiple sports APIs are queried for fixtures, standings, and news
2. **Caching Layer**: Data is cached in PostgreSQL with intelligent refresh strategies
3. **State Management**: Redux store manages application state with normalized data structures
4. **Component Rendering**: React components consume data through React Query with automatic background updates
5. **Real-time Updates**: Live matches are updated every 30 seconds for Pro tier API limits

## External Dependencies

### Sports Data APIs
- **RapidAPI (API-Football)**: Primary source for football fixtures, standings, and statistics
- **SportsRadar**: Secondary data source for additional sports coverage
- **BetsAPI**: News and additional sports content

### Infrastructure Services
- **Supabase**: User authentication and management
- **Neon Database**: PostgreSQL hosting for data persistence

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload using tsx
- **Production**: Built using Vite for client and ESBuild for server
- **Database**: Neon PostgreSQL with environment-based connection strings

### Scaling Considerations
- **Connection Pooling**: Database connection pool with proper lifecycle management
- **Error Handling**: Comprehensive error boundaries and graceful degradation
- **Memory Management**: EventEmitter listener limits and cleanup procedures

## Changelog
- June 26, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.