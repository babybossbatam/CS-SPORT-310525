
import React, { useState } from 'react';
import { Star, Trophy, Activity, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { enhancedApiWrapper } from '@/lib/enhancedApiWrapper';
import { format } from 'date-fns';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import TeamSelectionModal from '@/components/modals/TeamSelectionModal';

interface MyScoresTabProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const MyScoresTab: React.FC<MyScoresTabProps> = ({ selectedTab, onTabChange }) => {
  const [showTeamSelection, setShowTeamSelection] = useState(false);

  // Fetch suggested games (live and upcoming matches)
  const suggestedGamesQuery = useQuery({
    queryKey: ['suggested-games'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const fixtures = await enhancedApiWrapper.fetchFixturesByDate(today, 'MyScores');
      // Get first 10 matches as suggestions
      return fixtures.slice(0, 10);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 relative">
        <Star className="h-16 w-16 text-blue-500 fill-current" />
        <div className="absolute -top-1 -right-1">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={() => setShowTeamSelection(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full text-base font-medium"
      >
      </Button>
    </div>
  );

  const SuggestedGames = () => (
    <div className="mt-12">
      <h2 className="text-xl font-semibold text-center mb-8 text-gray-800">
        – Suggested Games –
      </h2>
      <div className="space-y-4 max-w-2xl mx-auto">
        {suggestedGamesQuery.data?.map((fixture: any) => (
          <Card key={fixture.fixture.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                      {format(new Date(fixture.fixture.date), 'EEE, MMM d')}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(new Date(fixture.fixture.date), 'h:mm a')}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <MyWorldTeamLogo 
                        teamId={fixture.teams.home.id}
                        teamName={fixture.teams.home.name}
                        size={24}
                      />
                      <span className="font-medium">{fixture.teams.home.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {fixture.fixture.status.short === 'NS' ? (
                        <span className="text-gray-400">vs</span>
                      ) : (
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {fixture.goals?.home || 0} - {fixture.goals?.away || 0}
                          </div>
                          {fixture.fixture.status.short !== 'FT' && (
                            <div className="text-xs text-green-600">
                              {fixture.fixture.status.elapsed}'
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MyWorldTeamLogo 
                        teamId={fixture.teams.away.id}
                        teamName={fixture.teams.away.name}
                        size={24}
                      />
                      <span className="font-medium">{fixture.teams.away.name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-sm text-gray-600">{fixture.league.name}</div>
                  <div className="text-xs text-gray-500">{fixture.league.country}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <TeamSelectionModal 
        open={showTeamSelection} 
        onOpenChange={setShowTeamSelection} 
      />
      
    </>
  );
};

export default MyScoresTab;
