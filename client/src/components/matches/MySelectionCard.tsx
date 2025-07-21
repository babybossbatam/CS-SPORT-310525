
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';

interface MySelectionCardProps {
  selectedTeams: any[];
  onRemoveTeam?: (teamId: string | number) => void;
  onShowTeamSelection?: () => void;
}

const MySelectionCard: React.FC<MySelectionCardProps> = ({
  selectedTeams,
  onRemoveTeam,
  onShowTeamSelection,
}) => {
  const handleRemoveTeam = (teamId: string | number) => {
    if (onRemoveTeam) {
      onRemoveTeam(teamId);
    }
  };

  const MyTeamsSection = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Teams and Leagues</h2>
        <button className="p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {selectedTeams.map((team) => (
          <div key={team.id} className="relative flex flex-col items-center group">
            <div className="w-12 h-12 mb-2 flex items-center justify-center">
              <MyWorldTeamLogo
                teamName={team.name}
                teamLogo={team.type === 'country' 
                  ? `https://hatscripts.github.io/circle-flags/flags/${team.flag}.svg`
                  : `/api/team-logo/square/${team.id}?size=48`
                }
                size="48px"
                className={team.type === 'country' 
                  ? "flag-circle rounded-full" 
                  : "rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                }
                alt={team.name}
                leagueContext={team.type === 'country' ? { name: 'International', country: 'World' } : undefined}
              />
            </div>
            
            {/* Remove button on hover */}
            <button
              onClick={() => handleRemoveTeam(team.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
            
            <span className="text-xs text-center text-gray-700 font-medium">
              {team.name}
            </span>
          </div>
        ))}
        
        <div className="flex flex-col items-center">
          <button 
            onClick={onShowTeamSelection}
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
    </div>
  );

  return (
    <Card className="shadow-md w-full mb-4">
      <CardContent className="pt-4 mt-4">
        <MyTeamsSection />
      </CardContent>
    </Card>
  );
};

export default MySelectionCard;
