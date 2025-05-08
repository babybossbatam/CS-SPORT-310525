import React, { useState, useEffect } from 'react';
import { List, LayoutGrid, Zap, ArrowUp, ArrowDown, Trash, Check, MoreVertical, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useIsMobile } from '@/hooks/use-mobile';

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  type?: string;
  isPriority?: boolean;
}

interface LeaguePriorityToggleProps {
  onPriorityChange?: (priorityLeagueIds: number[]) => void;
  initialPriorityLeagues?: number[];
}

const POPULAR_LEAGUES = [
  { id: 2, name: 'UEFA Champions League', country: 'Europe', type: 'cup' },
  { id: 3, name: 'UEFA Europa League', country: 'Europe', type: 'cup' },
  { id: 39, name: 'Premier League', country: 'England', type: 'league' },
  { id: 140, name: 'La Liga', country: 'Spain', type: 'league' },
  { id: 135, name: 'Serie A', country: 'Italy', type: 'league' },
  { id: 78, name: 'Bundesliga', country: 'Germany', type: 'league' },
  { id: 61, name: 'Ligue 1', country: 'France', type: 'league' },
  { id: 71, name: 'Serie A', country: 'Brazil', type: 'league' },
];

const LeaguePriorityToggle: React.FC<LeaguePriorityToggleProps> = ({
  onPriorityChange,
  initialPriorityLeagues = [2, 3, 39, 140, 135]
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [priorityLeagues, setPriorityLeagues] = useState<number[]>(initialPriorityLeagues);
  const [enabledLeagues, setEnabledLeagues] = useState<number[]>([...initialPriorityLeagues]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Fetch all available leagues
  const { data: leagues, isLoading } = useQuery<League[]>({
    queryKey: ['/api/leagues'],
    select: (data) => {
      // Map isPriority status to each league
      return data.map(league => ({
        ...league,
        isPriority: priorityLeagues.includes(league.id)
      }));
    }
  });
  
  useEffect(() => {
    if (onPriorityChange) {
      onPriorityChange(priorityLeagues);
    }
  }, [priorityLeagues, onPriorityChange]);
  
  // Toggle a league's enabled status
  const toggleLeagueEnabled = (leagueId: number) => {
    if (enabledLeagues.includes(leagueId)) {
      setEnabledLeagues(prev => prev.filter(id => id !== leagueId));
      setPriorityLeagues(prev => prev.filter(id => id !== leagueId));
    } else {
      setEnabledLeagues(prev => [...prev, leagueId]);
    }
  };
  
  // Toggle a league's priority status
  const toggleLeaguePriority = (leagueId: number) => {
    if (priorityLeagues.includes(leagueId)) {
      setPriorityLeagues(prev => prev.filter(id => id !== leagueId));
      toast({
        title: "Priority removed",
        description: `League removed from your priority list`,
      });
    } else {
      // Ensure the league is enabled first
      if (!enabledLeagues.includes(leagueId)) {
        setEnabledLeagues(prev => [...prev, leagueId]);
      }
      setPriorityLeagues(prev => [...prev, leagueId]);
      toast({
        title: "Priority added",
        description: `League added to your priority list`,
      });
    }
  };
  
  // Move a league up in priority
  const moveLeagueUp = (leagueId: number) => {
    const index = priorityLeagues.indexOf(leagueId);
    if (index > 0) {
      const newPriorityLeagues = [...priorityLeagues];
      const temp = newPriorityLeagues[index - 1];
      newPriorityLeagues[index - 1] = newPriorityLeagues[index];
      newPriorityLeagues[index] = temp;
      setPriorityLeagues(newPriorityLeagues);
    }
  };
  
  // Move a league down in priority
  const moveLeagueDown = (leagueId: number) => {
    const index = priorityLeagues.indexOf(leagueId);
    if (index < priorityLeagues.length - 1) {
      const newPriorityLeagues = [...priorityLeagues];
      const temp = newPriorityLeagues[index + 1];
      newPriorityLeagues[index + 1] = newPriorityLeagues[index];
      newPriorityLeagues[index] = temp;
      setPriorityLeagues(newPriorityLeagues);
    }
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(priorityLeagues);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPriorityLeagues(items);
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setPriorityLeagues(initialPriorityLeagues);
    setEnabledLeagues([...initialPriorityLeagues]);
    toast({
      title: "Reset complete",
      description: "League priorities have been reset to default",
    });
  };
  
  // Get league details by ID
  const getLeagueById = (id: number): League | undefined => {
    if (leagues) {
      return leagues.find(league => league.id === id);
    }
    
    // Fallback to popular leagues if main leagues data isn't loaded yet
    return POPULAR_LEAGUES.find(league => league.id === id) as League;
  };
  
  // Render a league item in the list view
  const renderLeagueListItem = (leagueId: number, index: number) => {
    const league = getLeagueById(leagueId);
    if (!league) return null;
    
    return (
      <Draggable key={leagueId} draggableId={`league-${leagueId}`} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="flex items-center justify-between py-2 px-3 bg-white border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2 w-6 text-center">{index + 1}</Badge>
              <img src={league.logo} alt={league.name} className="h-6 w-6 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{league.name}</span>
                <span className="text-xs text-gray-500">{league.country}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => moveLeagueUp(leagueId)}
                disabled={index === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => moveLeagueDown(leagueId)}
                disabled={index === priorityLeagues.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => toggleLeaguePriority(leagueId)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Draggable>
    );
  };
  
  // Render a league item in the grid view
  const renderLeagueGridItem = (league: League) => {
    const isPriority = priorityLeagues.includes(league.id);
    const isEnabled = enabledLeagues.includes(league.id);
    
    return (
      <div 
        key={league.id}
        className={`relative rounded-lg border p-3 flex flex-col items-center transition-all ${
          isPriority 
            ? 'border-blue-500 bg-blue-50'
            : isEnabled
              ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50'
        }`}
      >
        {isPriority && (
          <Badge className="absolute top-1 right-1 px-1.5 py-0.5">
            <Star className="h-3 w-3 mr-0.5" /> 
            Priority
          </Badge>
        )}
        
        <img src={league.logo} alt={league.name} className="h-12 w-12 mb-2" />
        <span className="text-sm font-medium text-center">{league.name}</span>
        <span className="text-xs text-gray-500 mb-2">{league.country}</span>
        
        <div className="flex items-center space-x-2 mt-auto">
          <Switch
            id={`enable-${league.id}`}
            checked={isEnabled}
            onCheckedChange={() => toggleLeagueEnabled(league.id)}
          />
          <Label htmlFor={`enable-${league.id}`} className="text-xs">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
        
        {isEnabled && (
          <Button
            variant={isPriority ? "default" : "outline"}
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={() => toggleLeaguePriority(league.id)}
          >
            {isPriority ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Prioritized
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" /> Make Priority
              </>
            )}
          </Button>
        )}
        
        {isPriority && (
          <div className="flex space-x-1 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-1"
              onClick={() => {
                const index = priorityLeagues.indexOf(league.id);
                moveLeagueUp(league.id);
              }}
              disabled={priorityLeagues.indexOf(league.id) === 0}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-1" 
              onClick={() => {
                const index = priorityLeagues.indexOf(league.id);
                moveLeagueDown(league.id);
              }}
              disabled={priorityLeagues.indexOf(league.id) === priorityLeagues.length - 1}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">League Priority Toggle</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={resetToDefaults}>
                Reset to defaults
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse">Loading leagues...</div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-100 p-3">
              <h3 className="font-medium">Priority Leagues (Drag to reorder)</h3>
              <p className="text-xs text-gray-500">These leagues will be shown first on the scoreboard</p>
            </div>
            
            {priorityLeagues.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No priority leagues set. Add some from the grid view.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="priority-leagues">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="min-h-[100px]"
                    >
                      {priorityLeagues.map((leagueId, index) => 
                        renderLeagueListItem(leagueId, index)
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Priority Leagues</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {priorityLeagues.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-gray-500 border rounded-md">
                    <p>No priority leagues set. Enable and prioritize leagues below.</p>
                  </div>
                ) : (
                  priorityLeagues.map(leagueId => {
                    const league = getLeagueById(leagueId);
                    return league ? renderLeagueGridItem(league) : null;
                  })
                )}
              </div>
            </div>
            
            <h3 className="font-medium mt-6 mb-2">All Leagues</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {leagues && leagues
                .filter(league => !priorityLeagues.includes(league.id))
                .slice(0, 12) // Limit to 12 non-priority leagues to avoid overwhelming
                .map(league => renderLeagueGridItem(league))
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaguePriorityToggle;