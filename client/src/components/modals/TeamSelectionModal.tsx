import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyCircularFlag from '@/components/common/MyCircularFlag';

interface TeamSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ open, onOpenChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('top');
  const [selectedTeams, setSelectedTeams] = useState<Set<string | number>>(new Set());

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
      return newSelection;
    });
  };

  const handleStarClick = (e: React.MouseEvent, teamId: string | number) => {
    e.stopPropagation();
    handleTeamClick(teamId);
  };

  const soccerTeams = popularTeams.filter(team => team.type === 'team');
  const countries = popularTeams.filter(team => team.type === 'country');

  const renderTeamGrid = (teams: typeof popularTeams, tabPrefix: string) => (
    <div className="grid grid-cols-5 gap-4 p-4 max-h-96 overflow-y-auto">
      {teams.map((team, index) => {
        const isSelected = selectedTeams.has(team.id);
        // Use combination of tab prefix, team id, and index to ensure uniqueness
        const uniqueKey = `${tabPrefix}-${team.type}-${team.id}-${index}`;
        return (
          <div
            key={uniqueKey}
            onClick={() => handleTeamClick(team.id)}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-transparent hover:border-blue-200 hover:border-blue-500'
            }`}
          >
            {/* Star toggle button - slides in on hover or always visible when selected */}
            <button
              className={`absolute top-1 right-1 w-6 h-6 shadow-md flex items-center justify-center transition-all duration-300 ease-out ${
                isSelected
                  ? 'opacity-100 transform translate-x-0'
                  : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'
              }`}
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>

          <div className="w-12 h-12 mb-2 flex items-center justify-center">
            {team.type === 'country' ? (
              <MyCircularFlag 
                countryCode={team.flag} 
                teamName={team.name}
                size={48} 
              />
            ) : (
              <MyWorldTeamLogo 
                teamName={team.name} 
                teamLogo={`/api/team-logo/square/${team.id}?size=48`}
                size="48px" 
              />
            )}
          </div>

          <span className="text-xs text-center text-gray-700 font-medium mb-1">
            {team.name}
          </span>

          {/* Popularity indicator - appears on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center text-blue-600">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold">
              {Math.floor(Math.random() * 50) + 10}.{Math.floor(Math.random() * 10)}K
            </span>
          </div>
        </div>
      );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">STEP 1 OF 2</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-4">
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
              <TabsTrigger value="hockey" className="text-xs">Hockey</TabsTrigger>
              <TabsTrigger value="baseball" className="text-xs">Baseball</TabsTrigger>
              <TabsTrigger value="tennis" className="text-xs">Tennis</TabsTrigger>
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

            <TabsContent value="hockey" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Hockey teams coming soon...
              </div>
            </TabsContent>

            <TabsContent value="baseball" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Baseball teams coming soon...
              </div>
            </TabsContent>

            <TabsContent value="tennis" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Tennis players coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            My Selections: <span className="font-medium">{selectedTeams.size}</span>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6">
            →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSelectionModal;