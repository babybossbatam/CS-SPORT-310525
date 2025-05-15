
import { useLocation, useNavigate } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EnhancedLeagueFixtures } from "@/components/matches/EnhancedLeagueFixtures";
import TopScorersList from "../leagues/TopScorersList";
import { LeagueScoreboard } from "@/components/matches/LeagueScoreboard";
import { MatchScoreboard } from "@/components/matches/MatchScoreboard";
import {
  Info,
  Calendar,
  Trophy,
  Newspaper,
  Video,
  GitBranch,
  BarChart2,
  Brain,
  ArrowLeftRight,
  History,
} from "lucide-react";

interface LeagueTabsDetailsProps {
  leagueId?: number;
  fixtures?: any[];
}

const LeagueTabsDetails = ({ leagueId, fixtures }: LeagueTabsDetailsProps) => {
  const [location, navigate] = useLocation();

  const leagueNavItems = [
    { name: "Details", href: `/league/${leagueId}`, icon: Info },
    { name: "Matches", href: `/league/${leagueId}/fixtures`, icon: Calendar },
    { name: "Standings", href: `/league/${leagueId}/standings`, icon: Trophy },
    { name: "News", href: `/league/${leagueId}/news`, icon: Newspaper },
    { name: "Highlights", href: `/league/${leagueId}/highlights`, icon: Video },
    { name: "Bracket", href: `/league/${leagueId}/bracket`, icon: GitBranch },
    { name: "Stats", href: `/league/${leagueId}/stats`, icon: BarChart2 },
    { name: "Insights", href: `/league/${leagueId}/insights`, icon: Brain },
    { name: "Transfers", href: `/league/${leagueId}/transfers`, icon: ArrowLeftRight },
    { name: "History", href: `/league/${leagueId}/history`, icon: History },
  ];

  if (!leagueId) return null;

  return (
    <div className="mx-auto pb-[120px]">
      <Tabs defaultValue={location.includes("/standings") ? "standings" : "details"} className="w-full">
        <TabsList className="flex border-t px-6 justify-start">
          {leagueNavItems.map((item) => {
            const isActive = location === item.href || (item.name === "Standings" && location.includes("/standings"));
            return (
              <TabsTrigger
                key={item.name}
                value={item.name.toLowerCase()}
                onClick={() => navigate(item.href)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-primary" : "hover:text-primary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Content sections */}
        <TabsContent value="details" className="px-6 py-4">
          {/* Details content */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8">
                {fixtures && fixtures.length > 0 && (
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <LeagueScoreboard
                        league={{
                          id: fixtures[0].league.id,
                          name: fixtures[0].league.name,
                          logo: fixtures[0].league.logo,
                          country: fixtures[0].league.country,
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
                    </CardContent>
                  </Card>
                )}

                <div className="mt-4">
                  <Card>
                    <CardContent>
                      <h4 className="font-semibold mb-4">Top Scorers</h4>
                      <TopScorersList leagueId={leagueId} />
                    </CardContent>
                  </Card>
                </div>
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

export default LeagueTabsDetails;
