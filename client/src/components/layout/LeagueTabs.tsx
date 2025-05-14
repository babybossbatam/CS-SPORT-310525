import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
}

const LeagueTabs = ({ leagueId, leagueName, leagueLogo, followers = "5.03M" }: LeagueTabsProps) => {
  const [location, navigate] = useLocation();

  const leagueNavItems = [
    { name: 'Details', href: `/league/${leagueId}` },
    { name: 'Matches', href: `/league/${leagueId}/fixtures` },
    { name: 'Standings', href: `/league/${leagueId}/standings` },
    { name: 'News', href: `/league/${leagueId}/news` },
    { name: 'Highlights', href: `/league/${leagueId}/highlights` },
    { name: 'Bracket', href: `/league/${leagueId}/bracket` },
    { name: 'Stats', href: `/league/${leagueId}/stats` },
    { name: 'Insights', href: `/league/${leagueId}/insights` },
    { name: 'Transfers', href: `/league/${leagueId}/transfers` },
    { name: 'History', href: `/league/${leagueId}/history` }
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

          <Tabs defaultValue={leagueNavItems[0].name.toLowerCase()} className="w-full">
            <TabsList className="flex overflow-x-auto no-scrollbar border-t px-6">
              {leagueNavItems.map((item) => (
                <TabsTrigger
                  key={item.name}
                  value={item.name.toLowerCase()}
                  onClick={() => navigate(item.href)}
                  className="flex-none px-4 py-2 text-sm font-medium transition-colors duration-200 hover:text-primary"
                >
                  {item.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeagueTabs;