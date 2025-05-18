import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import TeamLogo from './TeamLogo';
import { useState, useEffect } from 'react';
import { FixtureResponse } from '@/types/fixtures';

interface LeagueMatchScoreboardProps {
  match: FixtureResponse;
  matches?: FixtureResponse[];
  onClick?: () => void;
  featured?: boolean;
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
  maxMatches?: number;
}

export function LeagueMatchScoreboard({ 
  match, 
  matches = [],
  onClick, 
  featured = false,
  homeTeamColor = '#6f7c93',
  awayTeamColor = '#8b0000',
  compact = false,
  maxMatches = 5
}: LeagueMatchScoreboardProps) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter and sort matches based on status and time
  const filterMatches = (matches: FixtureResponse[]) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const eightHoursInSeconds = 8 * 60 * 60;

    // Popular leagues from PopularLeaguesList
    const popularLeagueIds = [137, 2, 3, 39, 45, 140, 135, 40, 48, 78];

    return matches.filter(match => {
      const matchTime = match.fixture.timestamp;
      const timeDiff = currentTime - matchTime;

      // Live matches (including 8 hours before)
      if (match.fixture.status.short === 'LIVE' || 
          (matchTime - currentTime <= eightHoursInSeconds && matchTime > currentTime)) {
        return true;
      }

      // Upcoming matches (only from popular leagues)
      if (match.fixture.status.short === 'NS' && matchTime > currentTime) {
        return popularLeagueIds.includes(match.league.id);
      }

      // Finished matches (within 8 hours after completion)
      if (match.fixture.status.short === 'FT' && timeDiff <= eightHoursInSeconds) {
        return true;
      }

      return false;
    }).sort((a, b) => {
      // Sort: Live > Upcoming > Finished
      const aIsLive = a.fixture.status.short === 'LIVE';
      const bIsLive = b.fixture.status.short === 'LIVE';
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // For upcoming matches, prioritize popular leagues
      if (a.fixture.status.short === 'NS' && b.fixture.status.short === 'NS') {
        return a.fixture.timestamp - b.fixture.timestamp;
      }

      return a.fixture.timestamp - b.fixture.timestamp;
    });
  };

  const filteredMatches = filterMatches([match, ...matches]).slice(0, maxMatches);
  const currentMatch = filteredMatches[currentMatchIndex] || filteredMatches[0];
  const { fixture, league, teams, goals, score } = currentMatch;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % allMatches.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [allMatches.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`flex relative h-[53px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} mt-[-8px]`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div className="w-full h-full flex justify-between relative">
        {/* Home team colored bar and logo */}
        <div className={`h-full w-[calc(50%-67px)] ml-[77px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`} 
          style={{ 
            background: homeTeamColor,
            transition: 'all 0.3s ease-in-out'
          }}>
          <img 
            key={`home-${teams?.home?.id}`}
            src={teams?.home?.id ? `https://cdn.sportmonks.com/images/soccer/teams/${teams.home.id}.png` : teams?.home?.logo} 
            alt={teams?.home?.name || 'Home Team'} 
            className={`absolute left-[-32px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
            style={{
              cursor: onClick ? 'pointer' : 'default',
              top: "calc(50% - 32px)"
            }}
            onClick={onClick}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('sportmonks') && teams?.home?.logo) {
                target.src = teams.home.logo;
              } else if (teams?.home?.name) {
                target.src = `/src/assets/fallback-logo.png`;
              }
            }}
          />
        </div>

        <div className={`absolute left-[125px] text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} max-w-[120px] truncate md:max-w-[200px]`} style={{top: "calc(50% - 8px)"}}>
          {teams?.home?.name || 'Home Team'}
        </div>

        {/* VS section */}
        <div 
          className={`absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: '#a00000',
            left: 'calc(50% - 26px)',
            top: 'calc(50% - 26px)',
            minWidth: '52px'
          }}
        >
          <span className="vs-text font-bold">VS</span>
        </div>

        {/* Away team colored bar and logo */}
        <div className={`h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          style={{ 
            background: awayTeamColor,
            transition: 'all 0.3s ease-in-out'
          }}>
        </div>

        <img 
          key={`away-${teams?.away?.id}`}
          src={teams?.away?.id ? `https://cdn.sportmonks.com/images/soccer/teams/${teams.away.id}.png` : teams?.away?.logo} 
          alt={teams?.away?.name || 'Away Team'} 
          className={`absolute right-[41px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
          style={{
            cursor: onClick ? 'pointer' : 'default',
            top: "calc(50% - 32px)"
          }}
          onClick={onClick}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.includes('sportmonks') && teams?.away?.logo) {
              target.src = teams.away.logo;
            } else if (teams?.away?.name) {
              target.src = `/src/assets/fallback-logo.png`;
            }
          }}
        />

        <div className={`absolute right-[125px] text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} max-w-[120px] truncate md:max-w-[200px]`} style={{top: "calc(50% - 8px)"}}>
          {teams?.away?.name || 'Away Team'}
        </div>
      </div>
    </div>
  );
}

export default LeagueMatchScoreboard;