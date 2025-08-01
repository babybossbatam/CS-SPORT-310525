import React, { useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import LeagueSelectionModal from './LeagueSelectionModal';


interface TeamSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamSelectionComplete?: (selectedTeams: any[]) => void;
  initialSelectedTeams?: any[];
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ 
  open, 
  onOpenChange, 
  onTeamSelectionComplete,
  initialSelectedTeams = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('top');
  const [selectedTeams, setSelectedTeams] = useState<Set<string | number>>(new Set());
  const [showLeagueSelection, setShowLeagueSelection] = useState(false);
  const [selectedLeagues, setSelectedLeagues] = useState<any[]>([]);

  // Sync internal state with initialSelectedTeams when modal opens and restore from localStorage
  React.useEffect(() => {
    if (open) {
      console.log("🎯 [TeamSelectionModal] Modal opened, syncing with initial selected teams:", initialSelectedTeams.length);

      // Try to restore from localStorage first
      try {
        const storedTeams = localStorage.getItem('selectedTeams');
        if (storedTeams) {
          const parsedTeams = JSON.parse(storedTeams);
          const storedTeamIds = new Set(parsedTeams.map((team: any) => team.id));
          console.log("🎯 [TeamSelectionModal] Restored teams from localStorage:", parsedTeams.length);
          setSelectedTeams(storedTeamIds);
          return; // Don't call onTeamSelectionComplete during restoration
        }
      } catch (error) {
        console.error("Error restoring teams from localStorage:", error);
      }

      // Fallback to sync internal state with parent's current selected teams
      const initialTeamIds = new Set(initialSelectedTeams.map(team => team.id));
      setSelectedTeams(initialTeamIds);
    }
  }, [open, initialSelectedTeams]);

  // Popular teams data with correct API-Sports team IDs
  const popularTeams = [
    // Countries first
    { id: 'brazil', name: 'Brazil', type: 'country', flag: 'br' },
    { id: 'england', name: 'England', type: 'country', flag: 'gb' },
    { id: 'spain', name: 'Spain', type: 'country', flag: 'es' },
    { id: 'italy', name: 'Italy', type: 'country', flag: 'it' },

    // Teams - ensuring no duplicates and correct Napoli ID (481)
    { id: 492, name: 'Napoli', type: 'team' },
    { id: 497, name: 'AS Roma', type: 'team' },
    { id: 536, name: 'Sevilla', type: 'team' },
    { id: 532, name: 'Valencia', type: 'team' },
    { id: 46, name: 'Leicester City', type: 'team' },

    { id: 24884, name: 'Al Nassr FC Riyadh', type: 'team' },
    { id: 541, name: 'Real Madrid', type: 'team' },
    { id: 529, name: 'FC Barcelona', type: 'team' },
    { id: 33, name: 'Manchester United', type: 'team' },
    { id: 40, name: 'Liverpool', type: 'team' },
    { id: 50, name: 'Manchester City', type: 'team' },
    { id: 49, name: 'Chelsea', type: 'team' },
    { id: 42, name: 'Arsenal', type: 'team' },
    { id: 157, name: 'Bayern Munich', type: 'team' },
    { id: 496, name: 'Juventus', type: 'team' },
    { id: 85, name: 'PSG', type: 'team' },
    { id: 530, name: 'Atletico Madrid', type: 'team' },
    { id: 489, name: 'AC Milan', type: 'team' },
    { id: 505, name: 'Inter Milan', type: 'team' },
    { id: 47, name: 'Tottenham', type: 'team' },
    { id: 165, name: 'Borussia Dortmund', type: 'team' },
    { id: 'portugal', name: 'Portugal', type: 'country', flag: 'pt' },
      { id: 'germany', name: 'Germany', type: 'country', flag: 'de' },
      { id: 'argentina', name: 'Argentina', type: 'country', flag: 'ar' },
      { id: 'france', name: 'France', type: 'country', flag: 'fr' },

  ];

  const handleTeamClick = (teamId: string | number) => {
    setSelectedTeams(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(teamId)) {
        newSelection.delete(teamId);
      } else {
        newSelection.add(teamId);
      }

      // Create selected teams array
      const selectedTeamsArray = Array.from(newSelection).map((teamId) => {
        const team = popularTeams.find(t => t.id === teamId);
        return team;
      }).filter(Boolean);

      // Save to localStorage
      try {
        localStorage.setItem('selectedTeams', JSON.stringify(selectedTeamsArray));
        console.log("🎯 [TeamSelectionModal] Saved teams to localStorage:", selectedTeamsArray.length);
      } catch (error) {
        console.error("Error saving teams to localStorage:", error);
      }

      // Only update parent component for actual user interactions (not during restoration)
      if (onTeamSelectionComplete) {
        onTeamSelectionComplete(selectedTeamsArray);
      }

      return newSelection;
    });
  };

  const handleStarClick = (e: React.MouseEvent, teamId: string | number) => {
    e.stopPropagation();
    handleTeamClick(teamId);
  };

  const handleNextStep = () => {
    console.log("🎯 [TeamSelectionModal] Next step clicked, selectedTeams size:", selectedTeams.size);
    console.log("🎯 [TeamSelectionModal] Selected team IDs:", Array.from(selectedTeams));
    if (onTeamSelectionComplete && selectedTeams.size > 0) {
      const selectedTeamsArray = Array.from(selectedTeams).map((teamId) => {
        const team = popularTeams.find(t => t.id === teamId);
        console.log("🎯 [TeamSelectionModal] Found team for ID", teamId, ":", team?.name);
        return team;
      }).filter(Boolean);

      // Save to localStorage
      try {
        localStorage.setItem('selectedTeams', JSON.stringify(selectedTeamsArray));
        console.log("🎯 [TeamSelectionModal] Saved teams to localStorage on next step:", selectedTeamsArray.length);
      } catch (error) {
        console.error("Error saving teams to localStorage:", error);
      }

      console.log("🎯 [TeamSelectionModal] Final selectedTeamsArray length:", selectedTeamsArray.length);
      console.log("🎯 [TeamSelectionModal] Calling onTeamSelectionComplete with:", selectedTeamsArray.map(t => t?.name));
      onTeamSelectionComplete(selectedTeamsArray);
    }
    // Close team selection modal first, then open league selection
    onOpenChange(false);
    setTimeout(() => {
      setShowLeagueSelection(true);
    }, 100); // Small delay to ensure smooth transition
  };

  const handleLeagueSelectionComplete = (leagues: any[]) => {
    console.log("🎯 [TeamSelectionModal] League selection completed:", leagues);
    setSelectedLeagues(leagues);
    
    // Force a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'selectedLeagues',
      newValue: JSON.stringify(leagues),
      storageArea: localStorage
    }));
  };

  const handleLeagueSelectionClose = () => {
    console.log("🎯 [TeamSelectionModal] Closing league selection modal");
    setShowLeagueSelection(false);
  };

  const handleLeaguePrevious = () => {
    console.log("🎯 [TeamSelectionModal] Previous clicked in league selection, reopening team selection");
    setShowLeagueSelection(false);
    onOpenChange(true); // Reopen the TeamSelectionModal
  };

  const soccerTeams = popularTeams.filter(team => team.type === 'team');
  const countries = popularTeams.filter(team => team.type === 'country');

  const renderTeamGrid = (teams: typeof popularTeams, tabPrefix: string) => (
    <div className="grid grid-cols-5 gap-1 md:gap-4 p-0">
      {teams.map((team, index) => {
        const isSelected = selectedTeams.has(team.id);
        // Use combination of tab prefix, team id, and index to ensure uniqueness
        const uniqueKey = `${tabPrefix}-${team.type}-${team.id}-${index}`;
        return (
          <div
            key={uniqueKey}
            onClick={() => handleTeamClick(team.id)}
            className={`group relative flex flex-col items-center justify-center h-32 w-full md:h-auto md:p-3 p-1 rounded-lg cursor-pointer transition-all duration-200 border ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-transparent hover:border-blue-200 hover:border-blue-500'
            }`}
          >
            {/* Star toggle button - slides in on hover or always visible when selected */}
            <button
              className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center transition-all duration-300 ease-out ${
                isSelected
                  ? 'opacity-100 transform translate-x-0'
                  : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'
              }`}
              style={{
                background: 'none',
                border: 'none',
                boxShadow: 'none'
              }}
              onClick={(e) => handleStarClick(e, team.id)}
            >
              <svg
                className={`w-4 h-4 transition-colors duration-200 ${
                  isSelected ? 'text-blue-500 fill-blue-500' : 'text-blue-500'
                }`}
                fill={isSelected ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-.181h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>

          <div className="w-10 h-10 md:w-12 md:h-12 mb-1 md:mb-2 flex items-center justify-center flex-shrink-0">
            <MyWorldTeamLogo
              teamName={team.name}
              teamLogo={team.type === 'country' 
                ? `https://hatscripts.github.io/circle-flags/flags/${team.flag}.svg`
                : `/api/team-logo/square/${team.id}?size=48`
              }
              size="40px"
              className={team.type === 'country' 
                ? "flag-circle rounded-full w-10 h-10 md:w-12 md:h-12" 
                : "rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 w-10 h-10 md:w-12 md:h-12"
              }
              alt={team.name}
              leagueContext={team.type === 'country' ? { name: 'International', country: 'World' } : undefined}
            />
          </div>

          <span className="text-xs md:text-sm text-center text-gray-700 font-medium mb-1 leading-tight px-1 line-clamp-1">
            {team.name}
          </span>

          {/* Popularity indicator - appears on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center text-blue-600 text-xs">
            <svg className="w-2 h-2 md:w-3 md:h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold whitespace-nowrap">
              {Math.floor(Math.random() * 50) + 10}.{Math.floor(Math.random() * 10)}K
            </span>
          </div>
        </div>
      );
      })}
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">STEP 1 OF 2</span>
          </div>

        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-lg font-semibold">SELECT TEAMS TO FOLLOW</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search For Teams"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-100">
              <TabsTrigger value="top" className="text-xs">Top</TabsTrigger>
              <TabsTrigger value="soccer" className="text-xs">Soccer</TabsTrigger>
              <TabsTrigger value="basketball" className="text-xs">Basketball</TabsTrigger>
              <TabsTrigger value="horseracing" className="text-xs">Horse Racing</TabsTrigger>
              <TabsTrigger value="snooker" className="text-xs">Snooker</TabsTrigger>
              <TabsTrigger value="esports" className="text-xs">Esports</TabsTrigger>
            </TabsList>

            <TabsContent value="top" className="mt-4">
              {renderTeamGrid(popularTeams, 'top')}
            </TabsContent>

            <TabsContent value="soccer" className="mt-4">
              {renderTeamGrid(soccerTeams, 'soccer')}
            </TabsContent>

            <TabsContent value="basketball" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Basketball teams coming soon...
              </div>
            </TabsContent>

            <TabsContent value="horseracing" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Horse racing coming soon...
              </div>
            </TabsContent>

            <TabsContent value="snooker" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Snooker players coming soon...
              </div>
            </TabsContent>

            <TabsContent value="esports" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Esports teams coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-shrink-0 p-2 md:p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="px-2 text-xs text-gray-700">
              My Selections: <span className="font-medium">{selectedTeams.size}</span>
            </div>
          </div>

          {/* Display selected team logos */}
          {selectedTeams.size > 0 && (
            <div className="flex flex-wrap gap-2 max-h-20 md:max-h-24 overflow-y-auto">
              {Array.from(selectedTeams).map((teamId) => {
                const team = popularTeams.find(t => t.id === teamId);
                if (!team) return null;

                return (
                  <div key={teamId} className="relative group">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200">
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

                    {/* Remove button on hover */}
                    <button
                      onClick={() => handleTeamClick(teamId)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>

                    {/* Team name tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {team.name}
                    </div>

                  </div>

                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end items-center gap-2 text-xs">
          <span> Next Step: Select Leagues</span>

          <Button 
            onClick={handleNextStep}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 mr-4 mb-2 "
          >
            <ChevronRight className=" h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <LeagueSelectionModal
      open={showLeagueSelection}
      onOpenChange={handleLeagueSelectionClose}
      onLeagueSelectionComplete={handleLeagueSelectionComplete}
      initialSelectedLeagues={selectedLeagues}
      onPrevious={handleLeaguePrevious}
    />
  </>
  );
};

export default TeamSelectionModal;