
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import MyCircularFlag from "@/components/common/MyCircularFlag";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import { isNationalTeam } from "@/lib/teamLogoSources";
import { parseISO, format } from "date-fns";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";

interface LazyMatchItemProps {
  match?: any;
  onMatchCardClick?: (match: any) => void;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  prefetchMargin?: string;
  onPrefetch?: () => Promise<void>;
  priority?: 'high' | 'normal' | 'low';
  showStarButton?: boolean;
  isStarred?: boolean;
  onToggleStar?: (matchId: number) => void;
}

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return "Unknown";
  
  const commonReplacements: { [key: string]: string } = {
    "Real Madrid": "Real Madrid",
    "Barcelona": "Barcelona", 
    "Manchester United": "Man United",
    "Manchester City": "Man City",
    "Tottenham Hotspur": "Tottenham",
    "Brighton & Hove Albion": "Brighton",
    "Sheffield United": "Sheffield Utd",
    "Newcastle United": "Newcastle",
    "Aston Villa": "Aston Villa",
    "Crystal Palace": "Crystal Palace",
    "West Ham United": "West Ham",
    "Nottingham Forest": "Nottm Forest",
    "AFC Bournemouth": "Bournemouth",
    "Wolverhampton Wanderers": "Wolves",
    "Atlético Madrid": "Atlético",
  };

  if (commonReplacements[teamName]) {
    return commonReplacements[teamName];
  }

  if (teamName.length <= 12) return teamName;
  
  const words = teamName.split(' ');
  if (words.length === 1) {
    return teamName.length > 10 ? teamName.substring(0, 10) + '..' : teamName;
  }
  
  if (words.length === 2) {
    const [first, second] = words;
    if (first.length + second.length <= 12) return teamName;
    return first.length > 6 ? first.substring(0, 6) + '..' : first + ' ' + (second.length > 5 ? second.substring(0, 5) + '..' : second);
  }
  
  return words[0] + ' ' + (words[words.length - 1].length > 6 ? words[words.length - 1].substring(0, 6) + '..' : words[words.length - 1]);
};

// Global intersection observer for better performance
let globalObserver: IntersectionObserver | null = null;
let prefetchObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, () => void>();
const prefetchElements = new Map<Element, () => Promise<void>>();

const LazyMatchItem: React.FC<LazyMatchItemProps> = ({
  match,
  onMatchCardClick,
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  prefetchMargin = '300px',
  onPrefetch,
  priority = 'normal',
  showStarButton = false,
  isStarred = false,
  onToggleStar
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Initialize global observers
  useEffect(() => {
    if (!globalObserver) {
      globalObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const callback = observedElements.get(entry.target);
            if (callback && entry.isIntersecting) {
              callback();
            }
          });
        },
        { rootMargin, threshold }
      );
    }

    if (!prefetchObserver && onPrefetch) {
      prefetchObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const prefetchCallback = prefetchElements.get(entry.target);
            if (prefetchCallback && entry.isIntersecting) {
              prefetchCallback();
            }
          });
        },
        { rootMargin: prefetchMargin, threshold: 0.01 }
      );
    }
  }, [rootMargin, threshold, prefetchMargin, onPrefetch]);

  const handleVisible = useCallback(() => {
    if (!hasLoaded) {
      setIsVisible(true);
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  const handlePrefetch = useCallback(async () => {
    if (!isPrefetched && onPrefetch) {
      setIsPrefetched(true);
      try {
        await onPrefetch();
      } catch (error) {
        console.warn('Prefetch failed:', error);
        setIsPrefetched(false);
      }
    }
  }, [isPrefetched, onPrefetch]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !globalObserver) return;

    // Register for visibility detection
    observedElements.set(element, handleVisible);
    globalObserver.observe(element);

    // Register for prefetching if callback provided
    if (onPrefetch && prefetchObserver) {
      prefetchElements.set(element, handlePrefetch);
      prefetchObserver.observe(element);
    }

    return () => {
      if (element) {
        observedElements.delete(element);
        globalObserver?.unobserve(element);
        
        if (prefetchObserver) {
          prefetchElements.delete(element);
          prefetchObserver.unobserve(element);
        }
      }
    };
  }, [handleVisible, handlePrefetch, onPrefetch]);

  const defaultFallback = (
    <div className="border rounded-lg p-4 animate-pulse bg-gray-50">
      <Skeleton className="h-4 w-32 mb-2" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-12" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );

  // If children are provided, render them (legacy mode)
  if (children) {
    return (
      <div 
        ref={elementRef}
        style={{ 
          minHeight: priority === 'high' ? '80px' : '60px',
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {isVisible ? children : (fallback || defaultFallback)}
      </div>
    );
  }

  // If no match data, show fallback
  if (!match) {
    return (
      <div 
        ref={elementRef}
        style={{ 
          minHeight: priority === 'high' ? '80px' : '60px',
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {fallback || defaultFallback}
      </div>
    );
  }

  // Render 3-grid match card if visible
  const renderMatchCard = () => {
    return (
      <div
        className="match-card-container group"
        onClick={() => onMatchCardClick?.(match)}
        style={{ cursor: onMatchCardClick ? 'pointer' : 'default' }}
      >
        {/* Star Button with slide-in effect */}
        {showStarButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar?.(match.fixture.id);
            }}
            className="match-star-button"
            title="Add to favorites"
          >
            <svg
              className={`match-star-icon ${isStarred ? 'starred' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )}

        {/* Three-grid layout container */}
        <div className="match-three-grid-container">
          {/* Top Grid: Match Status */}
          <div className="match-status-top">
            {(() => {
              const status = match.fixture.status.short;
              const elapsed = match.fixture.status.elapsed;

              // Live matches status
              if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                return (
                  <div className="match-status-label status-live">
                    {status === "HT" ? "Halftime" : `${elapsed || 0}'`}
                  </div>
                );
              }

              // Finished matches
              if (["FT", "AET", "PEN"].includes(status)) {
                return (
                  <div className="match-status-label status-ended">
                    Full Time
                  </div>
                );
              }

              return null;
            })()}
          </div>

          {/* Middle Grid: Main match content */}
          <div className="match-content-container">
            {/* Home Team Name */}
            <div
              className={`home-team-name ${
                match.goals.home !== null &&
                match.goals.away !== null &&
                match.goals.home > match.goals.away
                  ? "winner"
                  : ""
              }`}
            >
              {shortenTeamName(match.teams.home.name) || "Unknown"}
            </div>

            {/* Home Team Logo */}
            <div className="team-logo-container">
              {match.league.country === "World" ||
              match.league.country === "International" ? (
                <MyWorldTeamLogo
                  teamName={match.teams.home.name}
                  teamLogo={match.teams.home.logo}
                  alt={match.teams.home.name}
                  size="32px"
                  leagueContext={{
                    name: match.league.name,
                    country: match.league.country,
                  }}
                />
              ) : isNationalTeam(match.teams.home, match.league) ? (
                <MyCircularFlag
                  teamName={match.teams.home.name}
                  fallbackUrl={match.teams.home.logo}
                  alt={match.teams.home.name}
                  size="32px"
                />
              ) : (
                <img
                  src={match.teams.home.logo || "/assets/fallback-logo.png"}
                  alt={match.teams.home.name}
                  className="team-logo"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
              )}
            </div>

            {/* Score/Time Container */}
            <div className="match-score-container">
              {match.fixture.status.short === "NS" ? (
                <div className="match-time-display">
                  {(() => {
                    try {
                      const matchDate = parseISO(match.fixture.date);
                      return format(matchDate, "HH:mm");
                    } catch (error) {
                      return "TBD";
                    }
                  })()}
                </div>
              ) : (
                <div className="match-score-display">
                  {match.goals.home ?? 0} - {match.goals.away ?? 0}
                </div>
              )}
            </div>

            {/* Away Team Logo */}
            <div className="team-logo-container">
              {match.league.country === "World" ||
              match.league.country === "International" ? (
                <MyWorldTeamLogo
                  teamName={match.teams.away.name}
                  teamLogo={match.teams.away.logo}
                  alt={match.teams.away.name}
                  size="32px"
                  leagueContext={{
                    name: match.league.name,
                    country: match.league.country,
                  }}
                />
              ) : isNationalTeam(match.teams.away, match.league) ? (
                <MyCircularFlag
                  teamName={match.teams.away.name}
                  fallbackUrl={match.teams.away.logo}
                  alt={match.teams.away.name}
                  size="32px"
                />
              ) : (
                <img
                  src={match.teams.away.logo || "/assets/fallback-logo.png"}
                  alt={match.teams.away.name}
                  className="team-logo"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
              )}
            </div>

            {/* Away Team Name */}
            <div
              className={`away-team-name ${
                match.goals.home !== null &&
                match.goals.away !== null &&
                match.goals.away > match.goals.home
                  ? "winner"
                  : ""
              }`}
            >
              {shortenTeamName(match.teams.away.name) || "Unknown"}
            </div>
          </div>

          {/* Bottom Grid: Penalty Results */}
          <div className="match-penalty-bottom">
            {match.score?.penalty?.home !== null && match.score?.penalty?.away !== null && (
              <div className="penalty-result-display">
                <div className="penalty-text">
                  Penalties: {match.score.penalty.home} - {match.score.penalty.away}
                </div>
                <div className="penalty-winner">
                  {match.score.penalty.home > match.score.penalty.away
                    ? `${shortenTeamName(match.teams.home.name)} wins`
                    : `${shortenTeamName(match.teams.away.name)} wins`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={elementRef}
      style={{ 
        minHeight: priority === 'high' ? '80px' : '60px',
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      {isVisible ? renderMatchCard() : (fallback || defaultFallback)}
    </div>
  );
};

export default LazyMatchItem;
