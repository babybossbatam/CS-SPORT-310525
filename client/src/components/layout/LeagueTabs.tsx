
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface LeagueTabsProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
}

const LeagueTabs = ({ leagueId, leagueName, leagueLogo, followers = "5.03M" }: LeagueTabsProps) => {
  const [location] = useLocation();

  const leagueNavItems = [
    { name: 'Details', href: `/league/${leagueId}` },
    { name: 'Matches', href: `/league/${leagueId}/matches` },
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
          
          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto no-scrollbar border-t px-6">
            {leagueNavItems.map((item) => (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${
                    location === item.href 
                      ? 'text-blue-600 border-blue-600' 
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
                {item.name === 'Matches' && location === item.href && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-96">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <h3 className="font-semibold">Recent Matches</h3>
                          <div className="text-sm text-gray-600">
                            Click to view match details
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueTabs;
