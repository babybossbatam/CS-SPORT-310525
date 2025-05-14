import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MatchScoreboard } from '@/components/matches/MatchScoreboard';
import { Info, Calendar, Trophy, Newspaper, Video, GitBranch, BarChart2, Brain, ArrowLeftRight, History } from 'lucide-react';
import { EnhancedLeagueFixtures } from '@/components/matches/EnhancedLeagueFixtures';
import { LeagueStandings } from '@/components/stats/LeagueStandings';
import TeamLogo from '../matches/TeamLogo';

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
  fixtures?: any[];
}

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
              <Card>
                <CardContent className="p-4">
                  <div className="text-center text-sm text-gray-500">
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
                                <CardContent className="p-4">
                                  
                  
                    <div className="space-y-4">
                      <h4 className="font-semibold">Upcoming Fixtures</h4>
                      {fixtures
                        .filter(match => new Date(match.fixture.date) > new Date())
                        .slice(0, 5)
                        .map(match => (
                          <div key={match.fixture.id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => navigate(`/match/${match.fixture.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <TeamLogo teamId={match.teams.home.id} size="small" />
                              <span className="text-sm">{match.teams.home.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{match.teams.away.name}</span>
                              <TeamLogo teamId={match.teams.away.id} size="small" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Recent Results</h4>
                    <div className="space-y-4">
                      {fixtures
                        .filter(match => new Date(match.fixture.date) <= new Date())
                        .slice(0, 5)
                        .map(match => (
                          <div key={match.fixture.id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => navigate(`/match/${match.fixture.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <TeamLogo teamId={match.teams.home.id} size="small" />
                              <span className="text-sm">{match.teams.home.name}</span>
                            </div>
                            <div className="text-sm font-medium">
                              {match.goals.home} - {match.goals.away}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{match.teams.away.name}</span>
                              <TeamLogo teamId={match.teams.away.id} size="small" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                              
                              <Card className="mt-4">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Scores Overview</h4>
                                    <span className="text-sm text-gray-500">24/05/2025</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={fixtures?.[0]?.teams?.home?.logo} 
                                        alt="Team Logo" 
                                        className="w-8 h-8"
                                      />
                                      <span>{fixtures?.[0]?.teams?.home?.name}</span>
                                    </div>
                                    <span className="text-lg font-bold">22:00</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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