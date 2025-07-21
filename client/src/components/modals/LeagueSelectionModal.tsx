
import React, { useState } from 'react';
import { X, Search, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeagueSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueSelectionComplete?: (selectedLeagues: any[]) => void;
  initialSelectedLeagues?: any[];
}

const LeagueSelectionModal: React.FC<LeagueSelectionModalProps> = ({ 
  open, 
  onOpenChange, 
  onLeagueSelectionComplete,
  initialSelectedLeagues = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('top');
  const [selectedLeagues, setSelectedLeagues] = useState<Set<string | number>>(new Set());

  // Sync internal state with initialSelectedLeagues when modal opens
  React.useEffect(() => {
    if (open) {
      console.log("🎯 [LeagueSelectionModal] Modal opened, syncing with initial selected leagues:", initialSelectedLeagues.length);
      const initialLeagueIds = new Set(initialSelectedLeagues.map(league => league.id));
      setSelectedLeagues(initialLeagueIds);
    }
  }, [open, initialSelectedLeagues]);

  // Popular leagues data organized in 3 rows as shown in images
  const popularLeagues = [
    // Row 1: Top European competitions and Premier League
    { id: 2, name: 'UEFA Champions League', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe' },
    { id: 2, name: 'UEFA Champions League', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe' }, // Duplicate for visual consistency
    { id: 39, name: 'Premier League', type: 'league', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England' },
    { id: 45, name: 'FA Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/45.png', country: 'England' },
    { id: 140, name: 'La Liga', type: 'league', logo: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain' },
    
    // Row 2: More European leagues and competitions
    { id: 135, name: 'Serie A', type: 'league', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy' },
    { id: 3, name: 'UEFA Europa League', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/3.png', country: 'Europe' },
    { id: 667, name: 'Community Shield', type: 'friendly', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'England' },
    { id: 667, name: 'EFL Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'England' },
    { id: 78, name: 'Bundesliga', type: 'league', logo: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany' },
    
    // Row 3: International and other competitions
    { id: 667, name: 'Championship', type: 'league', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'England' },
    { id: 61, name: 'Ligue 1', type: 'league', logo: 'https://media.api-sports.io/football/leagues/61.png', country: 'France' },
    { id: 4, name: 'Euro Championship', type: 'international', logo: 'https://media.api-sports.io/football/leagues/4.png', country: 'Europe' },
    { id: 137, name: 'Copa del Rey', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/137.png', country: 'Spain' },
    { id: 1, name: 'Club World Cup', type: 'international', logo: 'https://media.api-sports.io/football/leagues/1.png', country: 'World' },
    
    // Row 4: Additional leagues
    { id: 667, name: 'League One', type: 'league', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'England' },
    { id: 667, name: 'UEFA WC Qualification', type: 'international', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'Europe' },
    { id: 667, name: 'Scottish Premiership', type: 'league', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'Scotland' },
    { id: 5, name: 'UEFA Nations League', type: 'international', logo: 'https://media.api-sports.io/football/leagues/5.png', country: 'Europe' },
    { id: 11, name: 'Africa Cup of Nations', type: 'international', logo: 'https://media.api-sports.io/football/leagues/11.png', country: 'Africa' },
    
    // Row 5: More international competitions
    { id: 667, name: 'League Two', type: 'league', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'England' },
    { id: 9, name: 'Copa America', type: 'international', logo: 'https://media.api-sports.io/football/leagues/9.png', country: 'South America' },
    { id: 848, name: 'UEFA Super Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/848.png', country: 'Europe' },
    { id: 667, name: 'Coppa Italia', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'Italy' },
    { id: 667, name: 'European Qualifiers', type: 'international', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'Europe' },
    
    // Row 6: Other sports and competitions
    { id: 667, name: 'NBA', type: 'basketball', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'USA' },
    { id: 667, name: 'Liga MX', type: 'league', logo: 'https://media.api-sports.io/football/leagues/307.png', country: 'Mexico' },
    { id: 667, name: 'Super Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'Various' },
    { id: 667, name: 'Friendly International', type: 'friendly', logo: 'https://media.api-sports.io/football/leagues/667.png', country: 'International' },
  ];

  const handleLeagueClick = (leagueId: string | number) => {
    setSelectedLeagues(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(leagueId)) {
        newSelection.delete(leagueId);
      } else {
        newSelection.add(leagueId);
      }
      
      // Immediately update parent component with current selections
      if (onLeagueSelectionComplete) {
        const selectedLeaguesArray = Array.from(newSelection).map((leagueId) => {
          const league = popularLeagues.find(l => l.id === leagueId);
          return league;
        }).filter(Boolean);
        
        onLeagueSelectionComplete(selectedLeaguesArray);
      }
      
      return newSelection;
    });
  };

  const handleStarClick = (e: React.MouseEvent, leagueId: string | number) => {
    e.stopPropagation();
    handleLeagueClick(leagueId);
  };

  const handleFinish = () => {
    console.log("🎯 [LeagueSelectionModal] Finish clicked, selectedLeagues size:", selectedLeagues.size);
    if (onLeagueSelectionComplete && selectedLeagues.size > 0) {
      const selectedLeaguesArray = Array.from(selectedLeagues).map((leagueId) => {
        const league = popularLeagues.find(l => l.id === leagueId);
        return league;
      }).filter(Boolean);
      
      onLeagueSelectionComplete(selectedLeaguesArray);
    }
    onOpenChange(false);
  };

  const soccerLeagues = popularLeagues.filter(league => league.type === 'league' || league.type === 'cup');
  const internationalLeagues = popularLeagues.filter(league => league.type === 'international');

  const renderLeagueGrid = (leagues: typeof popularLeagues, tabPrefix: string) => (
    <div className="grid grid-cols-5 gap-4 p-4">
      {leagues.map((league, index) => {
        const isSelected = selectedLeagues.has(league.id);
        const uniqueKey = `${tabPrefix}-${league.type}-${league.id}-${index}`;
        return (
          <div
            key={uniqueKey}
            onClick={() => handleLeagueClick(league.id)}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-transparent hover:border-blue-200 hover:border-blue-500'
            }`}
          >
            {/* Star toggle button */}
            <button
              className={`absolute top-1 right-1 w-6 h-6 shadow-md flex items-center justify-center transition-all duration-300 ease-out ${
                isSelected
                  ? 'opacity-100 transform translate-x-0'
                  : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'
              }`}
              onClick={(e) => handleStarClick(e, league.id)}
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
              <img
                src={league.logo}
                alt={league.name}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/assets/fallback-logo.png';
                }}
              />
            </div>

            <span className="text-xs text-center text-gray-700 font-medium mb-1">
              {league.name}
            </span>

            {/* Country indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center text-blue-600">
              <span className="text-xs font-semibold">
                {league.country}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">STEP 2 OF 2</span>
          </div>
          <div className="flex items-center text-blue-500 text-sm cursor-pointer hover:underline">
            Import from App
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-lg font-semibold">SELECT LEAGUES TO FOLLOW</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for Leagues or Cups"
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
              {renderLeagueGrid(popularLeagues, 'top')}
            </TabsContent>

            <TabsContent value="soccer" className="mt-4">
              {renderLeagueGrid(soccerLeagues, 'soccer')}
            </TabsContent>

            <TabsContent value="basketball" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Basketball leagues coming soon...
              </div>
            </TabsContent>

            <TabsContent value="horseracing" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Horse racing coming soon...
              </div>
            </TabsContent>

            <TabsContent value="snooker" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Snooker leagues coming soon...
              </div>
            </TabsContent>

            <TabsContent value="esports" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                Esports leagues coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="px-2 text-xs text-gray-700">
              My Selections: <span className="font-medium">{selectedLeagues.size}</span>
            </div>
          </div>

          {/* Display selected league logos */}
          {selectedLeagues.size > 0 && (
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto p-2">
              {Array.from(selectedLeagues).map((leagueId) => {
                const league = popularLeagues.find(l => l.id === leagueId);
                if (!league) return null;
                
                return (
                  <div key={leagueId} className="relative group">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={league.logo}
                        alt={league.name}
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/fallback-logo.png';
                        }}
                      />
                    </div>
                    
                    {/* Remove button on hover */}
                    <button
                      onClick={() => handleLeagueClick(leagueId)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                    
                    {/* League name tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {league.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 text-xs p-4">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
         
          <Button 
            onClick={handleFinish}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6"
          >
            Finish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeagueSelectionModal;
