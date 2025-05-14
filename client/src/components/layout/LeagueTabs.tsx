import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Calendar, Trophy, Newspaper, Video, GitBranch, BarChart2, Brain, ArrowLeftRight, History } from 'lucide-react';

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
}

const LeagueTabs = ({ leagueId, leagueName, leagueLogo, followers = "5.03M" }: LeagueTabsProps) => {
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

          <Tabs defaultValue="fixtures" className="w-full">
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeagueTabs;