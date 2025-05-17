
import { Button } from "@/components/ui/button";

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
  if (!leagueId) return null;

  return (
    <div className="bg-white border-b fixed left-0 right-0 top-[64px] z-40 shadow-md">
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

export default LeagueTabsHeader;
