
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";

interface MySelectionsCardProps {
  selectedTeams: any[];
  onAddMore: () => void;
}

const MySelectionsCard: React.FC<MySelectionsCardProps> = ({
  selectedTeams,
  onAddMore,
}) => {
  const countries = selectedTeams.filter(team => team.type === 'country');
  const teams = selectedTeams.filter(team => team.type === 'team');

  return (
    <Card className="shadow-md w-full mb-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Teams and Leagues</h2>
          <button className="p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Countries Section */}
        {countries.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-4">
              {countries.map((country) => (
                <div key={`country-${country.id}`} className="relative">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex flex-col items-center hover:border-blue-300 transition-colors">
                    {/* Star icon */}
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-blue-500 fill-blue-500" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    
                    <div className="w-12 h-12 mb-2 flex items-center justify-center">
                      <MyWorldTeamLogo
                        teamName={country.name}
                        teamLogo={`https://hatscripts.github.io/circle-flags/flags/${country.flag}.svg`}
                        size="48px"
                        className="flag-circle rounded-full"
                        alt={country.name}
                        leagueContext={{ name: 'International', country: 'World' }}
                      />
                    </div>
                    <span className="text-xs text-center text-gray-700 font-medium">
                      {country.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Section */}
        {teams.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-4">
              {teams.map((team) => (
                <div key={`team-${team.id}`} className="flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center">
                    <MyWorldTeamLogo
                      teamName={team.name}
                      teamLogo={`/api/team-logo/square/${team.id}?size=48`}
                      size="48px"
                      className="rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                      alt={team.name}
                    />
                  </div>
                  <span className="text-xs text-center text-gray-700 font-medium">
                    {team.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add More Section */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <button 
              onClick={onAddMore}
              className="w-12 h-12 mb-2 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
            >
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="text-xs text-center text-gray-500 font-medium">
              Add More
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500 text-center">
            Select your favorite leagues to follow them here
          </p>
        </div>

        {/* My Selections Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              My Selections: {selectedTeams.length}
            </span>
            <div className="flex space-x-1">
              {selectedTeams.slice(0, 3).map((team, index) => (
                <div key={`summary-${team.id}-${index}`} className="w-6 h-6">
                  <MyWorldTeamLogo
                    teamName={team.name}
                    teamLogo={team.type === 'country' 
                      ? `https://hatscripts.github.io/circle-flags/flags/${team.flag}.svg`
                      : `/api/team-logo/square/${team.id}?size=24`
                    }
                    size="24px"
                    className={team.type === 'country' 
                      ? "flag-circle rounded-full" 
                      : "rounded-full"
                    }
                    alt={team.name}
                  />
                </div>
              ))}
              {selectedTeams.length > 3 && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{selectedTeams.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MySelectionsCard;
