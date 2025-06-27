
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ExternalLink, Clock, Calendar } from 'lucide-react';

interface MyHighlightsProps {
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  matchStatus?: string;
  match?: any;
  matchId?: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  time: string;
  league: string;
  teams: string;
  status: string;
}

const MyHighlights: React.FC<MyHighlightsProps> = ({
  homeTeam,
  awayTeam,
  leagueName,
  matchStatus = "NS",
  match,
  matchId
}) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract team names from match object if available
  const getTeamNames = () => {
    if (match) {
      return {
        home: match.teams?.home?.name || homeTeam,
        away: match.teams?.away?.name || awayTeam,
        league: match.league?.name || leagueName,
        status: match.fixture?.status?.short || matchStatus
      };
    }
    return {
      home: homeTeam,
      away: awayTeam,
      league: leagueName,
      status: matchStatus
    };
  };

  const teamData = getTeamNames();

  // Fetch live fixtures to create news feed
  useEffect(() => {
    const fetchSportsNews = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/fixtures/date/${today}?all=true`);
        
        if (response.ok) {
          const fixtures = await response.json();
          
          // Create news items from live and recent fixtures
          const news = fixtures
            .filter((fixture: any) => {
              const status = fixture.fixture?.status?.short;
              return ['LIVE', '1H', '2H', 'HT', 'ET', 'P', 'FT', 'AET', 'PEN'].includes(status);
            })
            .slice(0, 10)
            .map((fixture: any, index: number) => {
              const status = fixture.fixture?.status?.short;
              const homeTeam = fixture.teams?.home?.name || 'Team A';
              const awayTeam = fixture.teams?.away?.name || 'Team B';
              const league = fixture.league?.name || 'Football';
              const homeScore = fixture.goals?.home ?? 0;
              const awayScore = fixture.goals?.away ?? 0;
              
              let title = '';
              let summary = '';
              
              if (['1H', '2H', 'LIVE'].includes(status)) {
                title = `🔴 LIVE: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`;
                summary = `Live match in progress in ${league}`;
              } else if (status === 'HT') {
                title = `⏸️ Half Time: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`;
                summary = `Half time break in ${league}`;
              } else if (status === 'FT') {
                title = `✅ Final: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`;
                summary = `Match concluded in ${league}`;
              } else {
                title = `⚽ ${homeTeam} vs ${awayTeam}`;
                summary = `${status} - ${league}`;
              }
              
              return {
                id: `news-${fixture.fixture?.id || index}`,
                title,
                summary,
                time: getTimeAgo(fixture.fixture?.date),
                league,
                teams: `${homeTeam} vs ${awayTeam}`,
                status
              };
            });
          
          setNewsItems(news);
        }
      } catch (error) {
        console.error('Error fetching sports news:', error);
        // Fallback news items
        setNewsItems([
          {
            id: 'fallback-1',
            title: '⚽ Football News Feed',
            summary: 'Stay updated with the latest football scores and highlights',
            time: 'Now',
            league: 'Sports Center',
            teams: 'Latest Updates',
            status: 'ACTIVE'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSportsNews();
    
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchSportsNews, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE':
      case '1H':
      case '2H':
        return '🔴';
      case 'HT':
        return '⏸️';
      case 'FT':
        return '✅';
      default:
        return '⚽';
    }
  };

  if (!teamData.home || !teamData.away) {
    return null;
  }

  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold flex items-center text-gray-800">
          <Play className="h-4 w-4 mr-2 text-red-500" />
          Live Sports News & Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative w-full rounded-lg overflow-hidden bg-white shadow-xl">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading sports feed...</p>
              </div>
            </div>
          )}
          
          <div className="max-h-96 overflow-y-auto">
            {newsItems.length > 0 ? (
              <div className="space-y-3 p-4">
                {newsItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-l-4 border-red-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {item.title}
                      </h4>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {item.summary}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.league}
                    </div>
                  </div>
                ))}
                
                {/* Current match highlight */}
                <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-blue-900">
                      🎯 Featured Match
                    </h4>
                    <span className="text-xs text-blue-600 font-medium">
                      {teamData.status}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 font-medium">
                    {teamData.home} vs {teamData.away}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {teamData.league}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 mb-4 inline-block">
                  <Play className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No Live Updates Available
                </h3>
                <p className="text-gray-600">
                  Sports feed will update when matches are live
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center">
          <Clock className="h-3 w-3 mr-1" />
          Live Sports Feed • Updates every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
