
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";

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
  const [isEditMode, setIsEditMode] = React.useState(false);

  const handleRemoveTeam = (teamId: string | number) => {
    if (onRemoveTeam) {
      onRemoveTeam(teamId);
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
          {/* Show all selected teams horizontally first */}
          {selectedTeams.map((team, index) => (
            <div key={`${team.id}-${index}`} className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-12 h-12 flex items-center justify-center">
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
                <span className="text-xs text-gray-600">{team.name}</span>
              </div>
            </div>
          ))}
          
          {/* Add More button and text - now positioned after selected teams */}
          <div className="flex flex-col items-center">
            <button
              onClick={onShowTeamSelection}
              className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
            >
              <Plus className="h-6 w-6 text-gray-400 hover:text-blue-500" />
            </button>
            
            {/* Add More text below the button */}
            <div className="text-center mt-1">
              <span className="text-xs text-gray-600">Add More</span>
            </div>
          </div>
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
      
      {/* New card below */}
      <Card className="shadow-md w-full mb-4">
        <CardContent className="pt-2 mt-2">
          <div className="space-y-4">
            {/* Header */}
          

            {/* Competitions Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {/* Button and Add More text in vertical layout */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={onShowTeamSelection}
                    className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex-shrink-0"
                  >
                    <Plus className="h-6 w-6 text-gray-400 hover:text-blue-500" />
                  </button>
                  
                  {/* Add More text below the button */}
                  <span className="text-xs text-gray-600 font-medium mt-1">Add More</span>
                </div>
                
                {/* Description text to the right */}
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    Select your favorite leagues to follow them here
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default MySelectionCard;
