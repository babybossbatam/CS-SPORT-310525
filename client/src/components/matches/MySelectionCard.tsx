import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";

interface MySelectionCardProps {
  selectedTeams: any[];
  onRemoveTeam?: (teamId: string | number) => void;
  onShowTeamSelection?: () => void;
  selectedLeagues?: any[];
  onRemoveLeague?: (leagueId: string | number) => void;
  onShowLeagueSelection?: () => void;
  onLeagueSelectionComplete?: (selectedLeagues: any[]) => void;
}

const MySelectionCard: React.FC<MySelectionCardProps> = ({
  selectedTeams,
  onRemoveTeam,
  onShowTeamSelection,
  selectedLeagues = [],
  onRemoveLeague,
  onShowLeagueSelection,
  onLeagueSelectionComplete,
}) => {
  const [isEditMode, setIsEditMode] = React.useState(false);

  // Add useEffect to load leagues from localStorage on component mount
  React.useEffect(() => {
    try {
      const storedLeagues = localStorage.getItem('selectedLeagues');
      if (storedLeagues && selectedLeagues.length === 0) {
        const parsedLeagues = JSON.parse(storedLeagues);
        console.log("🎯 [MySelectionCard] Restored leagues from localStorage:", parsedLeagues.length);
        // Call onLeagueSelectionComplete to sync with parent
        if (onLeagueSelectionComplete && parsedLeagues.length > 0) {
          onLeagueSelectionComplete(parsedLeagues);
        }
      }
    } catch (error) {
      console.error("Error restoring leagues from localStorage:", error);
    }
  }, [onLeagueSelectionComplete]);

  const handleRemoveTeam = (teamId: string | number) => {
    if (onRemoveTeam) {
      onRemoveTeam(teamId);
    }
  };

  const handleRemoveLeague = (leagueId: string | number) => {
    if (onRemoveLeague) {
      // Handle both regular leagues and qualifiers with unique identifiers
      const uniqueId = typeof leagueId === 'string' && leagueId.includes('_qualifiers') 
        ? leagueId 
        : leagueId;
      onRemoveLeague(uniqueId);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const MyTeamsSection = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">My Teams and Leagues</h3>
          {selectedTeams.length > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {selectedTeams.length}
            </span>
          )}
        </div>
        <button 
          className="p-1 hover:bg-gray-100 rounded"
          onClick={toggleEditMode}
        >
          <Edit className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Teams Section */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {/* Add More button first */}
          <div className="flex flex-col items-center">
            <button
              onClick={onShowTeamSelection}
              className=" w-9 h-9 border-2 border-dashed border-gray-500 rounded-full flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 text-gray-500 hover:text-blue-500" />
            </button>

            {/* Add More text below the button */}
            <div className="text-center mt-1">
              <span className="text-xs text-gray-600 whitespace-nowrap">Add More</span>
            </div>
          </div>

          {/* Show all selected teams horizontally after Add More button */}
          {selectedTeams.map((team, index) => (
            <div key={`${team.id}-${index}`} className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-9 h-9 flex items-center justify-center">
                  <MyWorldTeamLogo
                    teamName={team.name}
                    teamLogo={team.type === 'country' 
                      ? `https://hatscripts.github.io/circle-flags/flags/${team.flag}.svg`
                      : `/api/team-logo/square/${team.id}?size=36`
                    }
                    size="36px"
                    className={team.type === 'country' 
                      ? "flag-circle rounded-full" 
                      : "rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                    }
                    alt={team.name}
                    leagueContext={team.type === 'country' ? { name: 'International', country: 'World' } : undefined}
                  />
                </div>

                {/* Remove button - visible in edit mode or on hover */}
                <button
                  onClick={() => handleRemoveTeam(team.id)}
                  className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs transition-opacity duration-200 flex items-center justify-center hover:bg-red-600 ${
                    isEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  ×
                </button>

                {/* Team name tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {team.name}
                </div>
              </div>

              {/* Team name below logo */}
              <div className="text-center mt-1">
                <span className="text-xs text-gray-600 whitespace-nowrap">{team.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );

  const handleLeagueSelectionComplete = (leagues: any[]) => {
    console.log("🎯 [MySelectionCard] League selection completed:", leagues);

    // Save to localStorage first
    try {
      localStorage.setItem('selectedLeagues', JSON.stringify(leagues));
      console.log("🎯 [MySelectionCard] Saved leagues to localStorage:", leagues.length);
    } catch (error) {
      console.error("Error saving leagues to localStorage:", error);
    }

    // Call the parent's handler if provided
    if (onLeagueSelectionComplete) {
      onLeagueSelectionComplete(leagues);
    }
  };

  const MyLeaguesSection = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">My Leagues</h3>
          {selectedLeagues.length > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {selectedLeagues.length}
            </span>
          )}
        </div>
        <button 
          className="p-1 hover:bg-gray-100 rounded"
          onClick={toggleEditMode}
        >
          <Edit className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Leagues Section */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {/* Add More button first */}
          <div className="flex flex-col items-center">
            <button
              onClick={onShowLeagueSelection}
              className="w-9 h-9 border-2 border-dashed border-gray-500 rounded-full flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 text-gray-500 hover:text-blue-500" />
            </button>

            {/* Add More text below the button */}
            <div className="text-center mt-1">
              <span className="text-xs text-gray-600 whitespace-nowrap">Add More</span>
            </div>
          </div>

          {/* Show all selected leagues horizontally after Add More button */}
          {selectedLeagues.map((league, index) => {
            // Create unique identifier for leagues (including qualifiers)
            const uniqueKey = league.isQualifiers ? `${league.id}-qualifiers-${index}` : `${league.id}-${index}`;
            const uniqueId = league.isQualifiers ? `${league.id}_qualifiers` : league.id;

            return (
              <div key={uniqueKey} className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-9 h-9 flex items-center justify-center mt-1.5">
                    <img
                      src={`/api/league-logo/square/${league.id}?size=36`}
                      alt={league.name}
                      className="w-full h-full object-contain rounded-lg hover:shadow-lg transition-shadow duration-200"
                      onError={(e) => {
                        // Try fallback sources
                        if (e.currentTarget.src.includes('/api/league-logo/')) {
                          e.currentTarget.src = league.logo || '/assets/fallback-logo.png';
                        } else {
                          e.currentTarget.src = '/assets/fallback-logo.png';
                        }
                      }}
                    />
                  </div>

                  {/* Remove button - visible in edit mode or on hover */}
                  <button
                    onClick={() => handleRemoveLeague(uniqueId)}
                    className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs transition-opacity duration-200 flex items-center justify-center hover:bg-red-600 ${
                      isEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    ×
                  </button>

                  {/* League name tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    {league.name}
                  </div>
                </div>

                {/* League name below logo */}
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-600 block max-w-[60px] truncate">{league.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="shadow-md w-full mb-1">
        <CardContent className="pt-4 mt-4">
          <MyTeamsSection />
        </CardContent>
      </Card>

      {/* New card below for leagues */}
      <Card className="shadow-md w-full mb-4">
        <CardContent className="pt-4 mt-4">
          <MyLeaguesSection />
        </CardContent>
      </Card>
    </>
  );
};

export default MySelectionCard;