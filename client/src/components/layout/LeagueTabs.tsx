import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MatchScoreboard } from '@/components/matches/MatchScoreboard';
import { Info, Calendar, Trophy, Newspaper, Video, GitBranch, BarChart2, Brain, ArrowLeftRight, History } from 'lucide-react';
import { EnhancedLeagueFixtures } from '@/components/matches/EnhancedLeagueFixtures';
import { LeagueStandings } from '@/components/stats/LeagueStandings';
import TeamLogo from '../matches/TeamLogo';
import TopScorersList from '../leagues/TopScorersList';

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
  fixtures?: any[];
}

const LeagueTabs = ({ leagueId, leagueName, leagueLogo, followers = "5.03M", fixtures }: LeagueTabsProps) => {
  const [location, navigate] = useLocation();

  const leagueNavItems = [
    { name: 'Details', href: `/league/${leagueId}`, icon: Info },
    { name: 'Matches', href: `/league/${leagueId}/fixtures`, icon: Calendar },
    { name: 'Standings', href: `/league/${leagueId}/standings`, icon: Trophy },
    { name: 'News', href: `/league/${leagueId}/news`, icon: Newspaper },
    { name: 'Highlights', href: `/league/${leagueId}/highlights`, icon: Video },
    { name: 'Bracket', href: `/league/${leagueId}/bracket`, icon: GitBranch },
    { name: 'Stats', href: `/league/${leagueId}/stats`, icon: BarChart2 },
    { name: 'Insights', href: `/league/${leagueId}/insights`, icon: Brain },
    { name: 'Transfers', href: `/league/${leagueId}/transfers`, icon: ArrowLeftRight },
    { name: 'History', href: `/league/${leagueId}/history`, icon: History }
  ];

  if (!leagueId) return null;

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="mx-auto">
        <div className="flex flex-col">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <img 
                src={leagueLogo} 
                alt={leagueName}
                className="h-16 w-16 object-contain"
              />
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{leagueName}</h1>
                <Button variant="outline" size="sm">
                  Follow
                </Button>
                <span className="text-sm text-gray-500">{followers} followers</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="flex overflow-x-auto no-scrollbar border-t px-6 justify-start">
              {leagueNavItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <TabsTrigger
                    key={item.name}
                    value={item.name.toLowerCase()}
                    onClick={() => navigate(item.href)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'hover:text-primary'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="details" className="px-6 py-4">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{leagueName} Details</h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-8">
                    <Card>
                      <CardContent className="p-4">
                        {fixtures && fixtures.length > 0 && (
                          <MatchScoreboard
                            match={fixtures[0]}
                            homeTeamColor="#6f7c93"
                            awayTeamColor="#8b0000"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Top Scorers</h4>
                      </CardHeader>
                      <TopScorersList leagueId={leagueId} />
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="matches" className="px-6 py-4">
              <Card>
                <CardContent className="p-4">
                  <EnhancedLeagueFixtures
                    fixtures={fixtures}
                    onMatchClick={(matchId) => navigate(`/match/${matchId}`)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeagueTabs;