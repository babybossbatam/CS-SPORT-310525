
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Trophy, BarChart2, LineChart } from 'lucide-react';

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  matchId?: number;
}

const LeagueTabs = ({ leagueId, leagueName, leagueLogo, matchId }: LeagueTabsProps) => {
  const [, navigate] = useLocation();
  const [location] = useLocation();

  const leagueNavItems = [
    { name: 'Details', href: `/league/${leagueId}` },
    { name: 'Matches', href: `/league/${leagueId}/matches` },
    { name: 'Standings', href: `/league/${leagueId}/standings` },
    { name: 'News', href: `/league/${leagueId}/news` },
    { name: 'Highlights', href: `/league/${leagueId}/highlights` },
    { name: 'Transfers', href: `/league/${leagueId}/transfers` },
    { name: 'History', href: `/league/${leagueId}/history` },
  ];

  if (!leagueId) return null;

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-col">
          {/* League Header */}
          <div className="flex items-center gap-2 py-3 px-4 border-b">
            <img 
              src={leagueLogo}
              alt={leagueName}
              className="h-6 w-6 object-contain"
            />
            <span className="text-sm font-medium">{leagueName}</span>
            <button className="ml-2 px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
              Follow
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-b">
            {leagueNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 border-b-2 ${
                  location === item.href 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Match Actions */}
          {matchId && (
            <div className="grid grid-cols-3 gap-4 mt-4 text-center px-4 pb-4">
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/match/${matchId}/h2h`)}
              >
                <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
                <span className="text-xs text-neutral-500">H2H</span>
              </div>
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/match/${matchId}/stats`)}
              >
                <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
                <span className="text-xs text-neutral-500">Stats</span>
              </div>
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/league/${leagueId}/bracket`)}
              >
                <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
                <span className="text-xs text-neutral-500">Bracket</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueTabs;
