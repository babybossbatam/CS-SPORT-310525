import React, { useState } from 'react';
import { X, Search, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyLeagueLogo from "../common/MyLeagueLogo";

interface League {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  popularity: string;
  isQualifiers?: boolean;
}

interface LeagueSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueSelectionComplete?: (selectedLeagues: League[]) => void;
  initialSelectedLeagues?: League[];
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
      const initialLeagueIds = new Set(initialSelectedLeagues.map(league => {
        // Create unique identifier for leagues (including qualifiers)
        return league.isQualifiers ? `${league.id}_qualifiers` : league.id;
      }));
      setSelectedLeagues(initialLeagueIds);
    }
  }, [open, initialSelectedLeagues]);

  // Popular leagues data organized in 3 rows as shown in images
  const popularLeagues = [
    // Row 1: Top European competitions and Premier League
    { id: 2, name: 'UEFA Champions League', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', popularity: '37.09M', isQualifiers: false },
    { id: 2, name: 'UEFA Champions League Qualifiers', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', popularity: '15.2M', isQualifiers: true },
    { id: 39, name: 'Premier League', type: 'league', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England', popularity: '45.2M' },
    { id: 45, name: 'FA Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/45.png', country: 'England', popularity: '12.5M' },
    { id: 140, name: 'La Liga', type: 'league', logo: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain', popularity: '28.7M' },

    // Row 2: More European leagues and competitions
    { id: 135, name: 'Serie A', type: 'league', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy', popularity: '18.3M' },
    { id: 3, name: 'UEFA Europa League', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/3.png', country: 'Europe', popularity: '15.8M' },
    { id: 528, name: 'Community Shield', type: 'friendly', logo: 'https://media.api-sports.io/football/leagues/528.png', country: 'England', popularity: '3.2M' },
    { id: 46, name: 'EFL Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/46.png', country: 'England', popularity: '8.1M' },
    { id: 78, name: 'Bundesliga', type: 'league', logo: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany', popularity: '22.4M' },

    // Row 3: International and other competitions
    { id: 40, name: 'Championship', type: 'league', logo: 'https://media.api-sports.io/football/leagues/40.png', country: 'England', popularity: '6.7M' },
    { id: 61, name: 'Ligue 1', type: 'league', logo: 'https://media.api-sports.io/football/leagues/61.png', country: 'France', popularity: '14.9M' },
    { id: 4, name: 'Euro Championship', type: 'international', logo: 'https://media.api-sports.io/football/leagues/4.png', country: 'Europe', popularity: '52.1M' },
    { id: 137, name: 'Copa del Rey', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/137.png', country: 'Spain', popularity: '9.3M' },
    { id: 1, name: 'Club World Cup', type: 'international', logo: 'https://media.api-sports.io/football/leagues/1.png', country: 'World', popularity: '25.6M' },

    // Row 4: Additional leagues
    { id: 170, name: 'League One', type: 'league', logo: 'https://media.api-sports.io/football/leagues/170.png', country: 'England', popularity: '2.1M' },
    { id: 32, name: 'UEFA WC Qualification', type: 'international', logo: 'https://media.api-sports.io/football/leagues/32.png', country: 'Europe', popularity: '18.7M' },
    { id: 179, name: 'Scottish Premiership', type: 'league', logo: 'https://media.api-sports.io/football/leagues/179.png', country: 'Scotland', popularity: '1.8M' },
    { id: 5, name: 'UEFA Nations League', type: 'international', logo: 'https://media.api-sports.io/football/leagues/5.png', country: 'Europe', popularity: '12.3M' },
    { id: 11, name: 'Africa Cup of Nations', type: 'international', logo: 'https://media.api-sports.io/football/leagues/11.png', country: 'Africa', popularity: '8.9M' },

    // Row 5: More international competitions
    { id: 42, name: 'League Two', type: 'league', logo: 'https://media.api-sports.io/football/leagues/42.png', country: 'England', popularity: '1.2M' },
    { id: 9, name: 'Copa America', type: 'international', logo: 'https://media.api-sports.io/football/leagues/9.png', country: 'South America', popularity: '19.4M' },
    { id: 848, name: 'UEFA Super Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/848.png', country: 'Europe', popularity: '7.6M' },
    { id: 137, name: 'Coppa Italia', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/137.png', country: 'Italy', popularity: '5.4M' },
    { id: 858, name: 'CONCACAF Gold Cup - Qualification', type: 'international', logo: 'https://media.api-sports.io/football/leagues/858.png', country: 'CONCACAF', popularity: '2.7M' },

    // Row 6: World Cup qualifications and other competitions
    { id: 31, name: 'World Cup - Qualification CONCACAF', type: 'international', logo: 'https://media.api-sports.io/football/leagues/31.png', country: 'CONCACAF', popularity: '4.8M' },
    { id: 33, name: 'World Cup - Qualification Oceania', type: 'international', logo: 'https://media.api-sports.io/football/leagues/33.png', country: 'Oceania', popularity: '0.9M' },
    { id: 34, name: 'World Cup - Qualification South America', type: 'international', logo: 'https://media.api-sports.io/football/leagues/34.png', country: 'South America', popularity: '11.2M' },
    { id: 180, name: 'Super Cup', type: 'cup', logo: 'https://media.api-sports.io/football/leagues/180.png', country: 'Various', popularity: '3.5M' },
    { id: 205, name: 'Friendly International', type: 'friendly', logo: 'https://media.api-sports.io/football/leagues/205.png', country: 'International', popularity: '6.1M' },
  ];

  const handleLeagueClick = (league: any) => {
    // Create unique identifier for leagues (including qualifiers)
    const uniqueId = league.isQualifiers ? `${league.id}_qualifiers` : league.id;

    setSelectedLeagues(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(uniqueId)) {
        newSelection.delete(uniqueId);
      } else {
        newSelection.add(uniqueId);
      }

      // Immediately update parent component with current selections
      if (onLeagueSelectionComplete) {
        const selectedLeaguesArray = Array.from(newSelection).map((uniqueId) => {
          // Handle qualifier leagues
          if (typeof uniqueId === 'string' && uniqueId.includes('_qualifiers')) {
            const leagueId = parseInt(uniqueId.split('_')[0]);
            return popularLeagues.find(l => l.id === leagueId && l.isQualifiers);
          }
          // Handle regular leagues
          return popularLeagues.find(l => l.id === uniqueId && !l.isQualifiers);
        }).filter(Boolean);

        onLeagueSelectionComplete(selectedLeaguesArray);
      }

      return newSelection;
    });
  };

  const handleStarClick = (e: React.MouseEvent, league: any) => {
    e.stopPropagation();
    handleLeagueClick(league);
  };

  const handleFinish = () => {
    console.log("🎯 [LeagueSelectionModal] Finish clicked, selectedLeagues size:", selectedLeagues.size);
    if (onLeagueSelectionComplete && selectedLeagues.size > 0) {
      const selectedLeaguesArray = Array.from(selectedLeagues).map((uniqueId) => {
        // Handle qualifier leagues
        if (typeof uniqueId === 'string' && uniqueId.includes('_qualifiers')) {
          const leagueId = parseInt(uniqueId.split('_')[0]);
          return popularLeagues.find(l => l.id === leagueId && l.isQualifiers);
        }
        // Handle regular leagues
        return popularLeagues.find(l => l.id === uniqueId && !l.isQualifiers);
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
        const uniqueId = league.isQualifiers ? `${league.id}_qualifiers` : league.id;
        const isSelected = selectedLeagues.has(uniqueId);
        const uniqueKey = `${tabPrefix}-${league.type}-${league.id}-${league.isQualifiers ? 'qualifiers' : 'main'}-${index}`;
        return (
          <div
            key={uniqueKey}
            onClick={() => handleLeagueClick(league)}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-transparent hover:border-blue-300 hover:bg-blue-50'
            }`}
          >


            {/* Star toggle button */}
            <button
              className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center transition-all duration-300 ease-out ${
                isSelected
                  ? 'opacity-100 transform translate-x-0'
                  : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'
              }`}
              onClick={(e) => handleStarClick(e, league)}
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
              <MyLeagueLogo
                leagueId={league.id}
                leagueName={league.name}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div className="relative text-xs text-center text-gray-700 font-medium mb-1 h-8 flex items-center justify-center">
              <span className="group-hover:opacity-0 transition-opacity duration-200 line-clamp-2 leading-tight">
                {league.name}
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 font-semibold">
                {league.popularity}
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
            <span className="text-xs text-gray-500 uppercase">step 2 of 2</span>
          </div>

        </DialogHeader>

        <div className="flex-1 overflow-y-auto ">
          <h3 className="text-lg font-semibold uppercase ml-4">select leagues to follow</h3>

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
            <div className="pl-4 px-2 text-xs text-gray-700">
              My Selections: <span className="font-medium">{selectedLeagues.size}</span>
            </div>
          </div>

          {/* Display selected league logos */}
          {selectedLeagues.size > 0 && (
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto p-4">
              {Array.from(selectedLeagues).map((uniqueId) => {
                // Handle qualifier leagues
                let league;
                if (typeof uniqueId === 'string' && uniqueId.includes('_qualifiers')) {
                  const leagueId = parseInt(uniqueId.split('_')[0]);
                  league = popularLeagues.find(l => l.id === leagueId && l.isQualifiers);
                } else {
                  // Handle regular leagues
                  league = popularLeagues.find(l => l.id === uniqueId && !l.isQualifiers);
                }

                if (!league) return null;

                return (
                  <div key={uniqueId} className="relative group">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <MyLeagueLogo
                        leagueId={league.id}
                        leagueName={league.name}
                        className="w-8 h-8 object-contain rounded-full"
                      />
                    </div>

                    {/* Remove button on hover */}
                    <button
                      onClick={() => handleLeagueClick(league)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                      title="Remove from My Selections"
                    >
                      ×
                    </button>

                    {/* League name tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs  opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
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