
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

  // Popular teams data
  const popularTeams = [
    { id: 'brazil', name: 'Brazil', type: 'country', flag: 'br' },
    { id: 'england', name: 'England', type: 'country', flag: 'gb' },
    { id: 'spain', name: 'Spain', type: 'country', flag: 'es' },
    { id: 529, name: 'AS Roma', type: 'team' },
    { id: 489, name: 'Napoli', type: 'team' },
    { id: 720, name: 'Sevilla', type: 'team' },
    { id: 165, name: 'Al Hilal Riyadh', type: 'team' },
    { id: 532, name: 'Valencia', type: 'team' },
    { id: 'italy', name: 'Italy', type: 'country', flag: 'it' },
    { id: 2385, name: 'Al Nassr FC Riyadh', type: 'team' },
    { id: 26, name: 'Leicester City', type: 'team' },
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
    { id: 47, name: 'Tottenham', type: 'team' },
    { id: 165, name: 'Borussia Dortmund', type: 'team' },
    { id: 'portugal', name: 'Portugal', type: 'country', flag: 'pt' },
    { id: 'germany', name: 'Germany', type: 'country', flag: 'de' },
    { id: 'argentina', name: 'Argentina', type: 'country', flag: 'ar' },
    { id: 'inter', name: 'Inter', type: 'country', flag: 'it' },
    { id: 'france', name: 'France', type: 'country', flag: 'fr' },
  ];

  const soccerTeams = popularTeams.filter(team => team.type === 'team');
  const countries = popularTeams.filter(team => team.type === 'country');

  const renderTeamGrid = (teams: typeof popularTeams) => (
    <div className="grid grid-cols-5 gap-4 p-4 max-h-96 overflow-y-auto">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 mb-2 flex items-center justify-center">
            {team.type === 'country' ? (
              <MyCircularFlag countryCode={team.flag} size={48} />
            ) : (
              <MyWorldTeamLogo 
                teamId={team.id as number} 
                teamName={team.name} 
                teamLogo={`/api/team-logo/square/${team.id}?size=48`}
                size="48px" 
              />
            )}</div>
          </div>
          <span className="text-xs text-center text-gray-700 font-medium">
            {team.name}
          </span>
        </div>
      ))}
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
              {renderTeamGrid(popularTeams)}
            </TabsContent>

            <TabsContent value="soccer" className="mt-4">
              {renderTeamGrid(soccerTeams)}
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
            My Selections: <span className="font-medium">0</span>
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
