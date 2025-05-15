
import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MatchScoreboard } from '@/components/matches/MatchScoreboard';
import { LeagueScoreboard } from '@/components/matches/LeagueScoreboard';
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
      <div className="flex items-center gap-4 p-4">
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

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="flex border-t px-6 justify-start">
          {leagueNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <TabsTrigger
                key={item.name}
                value={item.href.split('/').pop() || 'details'}
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

        <TabsContent value={`${leagueId}`} className="px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8">
                {fixtures && fixtures.length > 0 && (
                  <div className="mb-4">
                    <LeagueScoreboard
                      league={{
                        id: fixtures[0].league.id,
                        name: fixtures[0].league.name,
                        logo: fixtures[0].league.logo,
                        country: fixtures[0].league.country
                      }}
                      homeTeamColor="#6f7c93"
                      awayTeamColor="#8b0000"
                    />
                    <div className="mt-4">
                      <MatchScoreboard
                        match={fixtures[0]}
                        homeTeamColor="#6f7c93"
                        awayTeamColor="#8b0000"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">Top Scorers</h4>
                    </CardHeader>
                    <TopScorersList leagueId={leagueId} />
                  </Card>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="space-y-4">
                      <Tabs defaultValue="overview">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="overview">Score Overview</TabsTrigger>
                          <TabsTrigger value="result">Result</TabsTrigger>
                          <TabsTrigger value="fixture">Fixture</TabsTrigger>
                        </TabsList>
                        <div className="flex justify-center">
                          <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Quarter Finals • Leg 2/2
                          </span>
                        </div>
                      </Tabs>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="bg-[#f7f7f7]">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium">Fixtures</h4>
                        <div className="text-xs text-gray-500 mt-1">17/05/2025</div>
                      </div>
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Quarter Finals
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {fixtures?.slice(0, 5).map((fixture) => (
                      <div key={fixture.fixture.id} className="py-3 border-b last:border-0 bg-white mb-1">
                        <div className="flex justify-between items-center px-4">
                          <div className="flex flex-col items-center w-[35%] gap-1">
                            <img 
                              src={fixture.teams.home.logo} 
                              alt={fixture.teams.home.name}
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-sm text-center truncate">{fixture.teams.home.name}</span>
                          </div>
                          <span className="text-sm font-medium min-w-[60px] text-center">
                            {format(new Date(fixture.fixture.date), "HH:mm")}
                          </span>
                          <div className="flex flex-col items-center w-[35%] gap-1">
                            <img 
                              src={fixture.teams.away.logo} 
                              alt={fixture.teams.away.name}
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-sm text-center truncate">{fixture.teams.away.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="w-full text-center text-sm text-gray-600 hover:text-gray-800 mt-2">
                      FA Cup Fixtures →
                    </button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">League Overview</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Matches</span>
                        <span>{fixtures?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Played</span>
                        <span>{fixtures?.filter(f => f.fixture.status.short === "FT").length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining</span>
                        <span>{fixtures?.filter(f => f.fixture.status.short === "NS").length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
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
  );
};

export default LeagueTabs;
