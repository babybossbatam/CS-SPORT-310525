
import { Button } from "@/components/ui/button";
import LeagueTabs from "./LeagueTabs";
import { useQuery } from '@tanstack/react-query';

interface LeagueTabsHeaderProps {
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  followers?: string;
}

const LeagueTabsHeader = ({
  leagueId,
  leagueName,
  leagueLogo,
  followers = "5.03M",
}: LeagueTabsHeaderProps) => {
  // Fetch standings data for this league
  const { data: standingsData, isLoading, error } = useQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;
      const response = await fetch(`/api/standings?league=${leagueId}&season=2025`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!leagueId) return null;

  return (
    <>
      <div className="bg-white border-b fixed left-0 right-0 top-[64px] z-40">
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
              <span className="text-sm text-gray-500">
                {followers} followers
              </span>
            </div>
          </div>
          
          {/* Display standings data if available */}
          {standingsData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Group Standings</h3>
              {standingsData.league?.standings?.map((group: any[], groupIndex: number) => (
                <div key={groupIndex} className="mb-4">
                  {standingsData.league.standings.length > 1 && (
                    <h4 className="font-medium mb-2">
                      {group[0]?.group || `Group ${String.fromCharCode(65 + groupIndex)}`}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {group.slice(0, 5).map((team: any) => (
                      <div key={team.team.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-medium">{team.rank}</span>
                          <img
                            src={team.team.logo}
                            alt={team.team.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/assets/fallback-logo.svg";
                            }}
                          />
                          <span>{team.team.name}</span>
                        </div>
                        <span className="font-medium">{team.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Loading standings...</div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">Failed to load standings data</div>
            </div>
          )}
        </div>
      </div>
      <div className="fixed left-0 right-0 top-[152px] z-40 bg-white shadow-md">
        <div className="px-6 border-t">
          <LeagueTabs />
        </div>
      </div>
    </>
  );
};

export default LeagueTabsHeader;
