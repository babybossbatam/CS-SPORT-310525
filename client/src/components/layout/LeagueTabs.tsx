import { useLocation, useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeagueMatchScoreboard } from "@/components/matches/LeagueMatchScoreboard";
import { LeagueScoreboard } from "@/components/matches/LeagueScoreboard";
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
import { EnhancedLeagueFixtures } from "@/components/matches/EnhancedLeagueFixtures";
import { LeagueStandings } from "@/components/stats/LeagueStandings";
import TeamLogo from "../matches/TeamLogo";
import TopScorersList from "../leagues/TopScorersList";

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
  fixtures?: any[];
}

const LeagueTabsHeader = ({
  leagueId,
  leagueName,
  leagueLogo,
  followers = "5.03M",
}: LeagueTabsProps) => {
  if (!leagueId) return null;

  return (
    <div className="bg-white border-b fixed left-0 right-0 top-[48px] z-40 shadow-md">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <img
            src={leagueLogo}
            alt={leagueName}
            className="h-16 w-16 object-contain"
          />
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {leagueName}
            </h1>
            <Button variant="outline" size="sm">
              Follow
            </Button>
            <span className="text-sm text-gray-500">
              {followers} followers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeagueTabsDetails = ({
  leagueId,
  fixtures = [],
}: LeagueTabsProps) => {
  const [location, navigate] = useLocation();
  if (!leagueId) return null;

  const leagueNavItems = [
    { name: "Details", href: `/league/${leagueId}`, icon: Info },
    { name: "Matches", href: `/league/${leagueId}/fixtures`, icon: Calendar },
    { name: "Standings", href: `/league/${leagueId}/standings`, icon: Trophy },
    { name: "News", href: `/league/${leagueId}/news`, icon: Newspaper },
    { name: "Highlights", href: `/league/${leagueId}/highlights`, icon: Video },
    { name: "Bracket", href: `/league/${leagueId}/bracket`, icon: GitBranch },
    { name: "Stats", href: `/league/${leagueId}/stats`, icon: BarChart2 },
    { name: "Insights", href: `/league/${leagueId}/insights`, icon: Brain },
    {
      name: "Transfers",
      href: `/league/${leagueId}/transfers`,
      icon: ArrowLeftRight,
    },
    { name: "History", href: `/league/${leagueId}/history`, icon: History },
  ];

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

        <TabsContent value="details" className="px-6 py-4">
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
                      <LeagueMatchScoreboard
                        match={fixtures[0]}
                        homeTeamColor="#6f7c93"
                        awayTeamColor="#8b0000"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent>
                  <h4 className="font-semibold mb-4">Top Scorers</h4>
                  <TopScorersList leagueId={leagueId} />
                </CardContent>
              </Card>
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

const LeagueTabs = ({
  leagueId,
  leagueName,
  leagueLogo,
  followers,
  fixtures,
}: LeagueTabsProps) => {
  if (!leagueId) return null;

  return (
    <>
      <LeagueTabsHeader
        leagueId={leagueId}
        leagueName={leagueName}
        leagueLogo={leagueLogo}
        followers={followers}
      />
      <LeagueTabsDetails 
        leagueId={leagueId}
        fixtures={fixtures}
      />
    </>
  );
};

export default LeagueTabs;
export { LeagueTabsHeader, LeagueTabsDetails };