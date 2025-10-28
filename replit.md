# Football Scores Application

## Overview

This is a full-stack football scores application built with React and Express.js. It provides live football fixtures, scores, leagues, and standings from various global competitions. The application features a modern UI using shadcn/ui components and integrates with sports APIs for real-time data. Its purpose is to offer a comprehensive and user-friendly platform for tracking football events.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Redux Toolkit
- **Data Fetching**: TanStack React Query for server state management and caching
- **Routing**: Wouter
- **Icons**: Phosphor Icons React
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM (using Neon Database)
- **API Integration**: Axios for external sports API calls

### Core Features & Design
- **Data Management**: Centralized data provider, intelligent caching for fixtures, leagues, and logos, with fallback mechanisms. Includes a popular league filtering system.
- **UI Components**: Match cards, league cards, popular league displays, and a custom date selector.
- **Data Flow**: React Query manages API calls and caching, Redux Toolkit handles global state, and components re-render automatically. Multi-layered caching (React Query + localStorage) is used for performance.
- **Filtering & Prioritization**: Leagues are prioritized geographically (Tier 1: England, Spain, Italy, Germany, France) with specific league allowances and an exclusion system for unwanted competitions.
- **Performance Optimizations**: Implemented progressive loading, request deduplication, reduced React Query cache times, and scroll-based lazy loading to prevent system overload and improve responsiveness. Backend API calls are parallelized and rate-limited. **CRITICAL FIX (Oct 28, 2025)**: Disabled ALL background polling (refetchInterval) in MyNewLeague2 to prevent Replit IDE freezing - workspace has limited RAM/CPU that cannot handle continuous background API calls. Removed loading spinners from MyRightContent (now uses lazy loading only). Trade-off: Live scores don't auto-refresh, but IDE never freezes.

## External Dependencies

- **Sports API**: RapidAPI for live sports data.
- **Flag/Logo APIs**: Multiple fallback systems for country flags and team logos.
- **Database Provider**: Neon Database.
- **Secondary Data Storage**: Supabase (also for authentication).
- **Core Libraries**: React, React DOM, React Query, React Redux, shadcn/ui, Radix UI, Tailwind CSS, Drizzle ORM, Axios, date-fns, React Hook Form.