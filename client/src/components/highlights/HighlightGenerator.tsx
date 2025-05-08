import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { X, Trash, Plus, Share2, Sparkles, Save, Download, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { FixtureResponse } from '@/types/fixtures';

interface HighlightMoment {
  id: string;
  time: number; // Match minute
  title: string;
  description: string;
  type: 'goal' | 'card' | 'substitution' | 'chance' | 'other';
  teamId: number;
  playerId?: number;
}

interface HighlightClip {
  id: string;
  title: string;
  description: string;
  moments: HighlightMoment[];
  matchId: number;
  creator: string;
  createdAt: Date;
  likes: number;
  duration: number; // in seconds
}

interface HighlightGeneratorProps {
  match: FixtureResponse;
}

const DEFAULT_DURATION = 30; // 30 second highlight by default

export function HighlightGenerator({ match }: HighlightGeneratorProps) {
  const [activeTab, setActiveTab] = useState('create');
  const [highlights, setHighlights] = useState<HighlightClip[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<HighlightClip>({
    id: crypto.randomUUID(),
    title: `${match.teams.home.name} vs ${match.teams.away.name} Highlights`,
    description: 'User generated highlights',
    moments: [],
    matchId: match.fixture.id,
    creator: 'You',
    createdAt: new Date(),
    likes: 0,
    duration: DEFAULT_DURATION
  });
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Sample moment types with icons
  const momentTypes = [
    { value: 'goal', label: 'Goal', icon: '⚽' },
    { value: 'card', label: 'Card', icon: '🟨' },
    { value: 'substitution', label: 'Sub', icon: '🔄' },
    { value: 'chance', label: 'Chance', icon: '💫' },
    { value: 'other', label: 'Other', icon: '📌' }
  ];

  const addMoment = () => {
    const newMoment: HighlightMoment = {
      id: crypto.randomUUID(),
      time: match.fixture.status.elapsed || 45,
      title: 'New Moment',
      description: '',
      type: 'other',
      teamId: match.teams.home.id
    };
    
    setCurrentHighlight({
      ...currentHighlight,
      moments: [...currentHighlight.moments, newMoment]
    });
    
    setSelectedMoment(newMoment.id);
    setIsDialogOpen(true);
  };

  const updateMoment = (updatedMoment: HighlightMoment) => {
    setCurrentHighlight({
      ...currentHighlight,
      moments: currentHighlight.moments.map(moment => 
        moment.id === updatedMoment.id ? updatedMoment : moment
      )
    });
    setIsDialogOpen(false);
  };

  const deleteMoment = (id: string) => {
    setCurrentHighlight({
      ...currentHighlight,
      moments: currentHighlight.moments.filter(moment => moment.id !== id)
    });
    setSelectedMoment(null);
  };

  const saveHighlight = () => {
    if (editMode) {
      // Update existing highlight
      setHighlights(highlights.map(h => 
        h.id === currentHighlight.id ? currentHighlight : h
      ));
      setEditMode(false);
    } else {
      // Create new highlight
      setHighlights([...highlights, currentHighlight]);
    }
    
    // Reset to a new highlight
    setCurrentHighlight({
      id: crypto.randomUUID(),
      title: `${match.teams.home.name} vs ${match.teams.away.name} Highlights`,
      description: 'User generated highlights',
      moments: [],
      matchId: match.fixture.id,
      creator: 'You',
      createdAt: new Date(),
      likes: 0,
      duration: DEFAULT_DURATION
    });
    
    setActiveTab('explore');
  };

  const editHighlight = (highlight: HighlightClip) => {
    setCurrentHighlight(highlight);
    setEditMode(true);
    setActiveTab('create');
  };

  const shareHighlight = (highlight: HighlightClip) => {
    // Implement sharing functionality (could be a URL or social media integration)
    alert(`Sharing highlight: ${highlight.title}`);
  };

  const getTeamColor = (teamId: number) => {
    if (teamId === match.teams.home.id) {
      return 'bg-red-500';
    }
    return 'bg-blue-500';
  };

  const getTeamName = (teamId: number) => {
    if (teamId === match.teams.home.id) {
      return match.teams.home.name;
    }
    return match.teams.away.name;
  };

  const getMomentTypeDetails = (type: string) => {
    return momentTypes.find(t => t.value === type) || momentTypes[4]; // Default to "other"
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          Match Highlight Generator
        </CardTitle>
        <CardDescription>
          Create and share your own match highlights
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Highlights</TabsTrigger>
          <TabsTrigger value="explore">Explore Highlights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={currentHighlight.title}
                onChange={(e) => setCurrentHighlight({...currentHighlight, title: e.target.value})}
                placeholder="Highlight title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={currentHighlight.description}
                onChange={(e) => setCurrentHighlight({...currentHighlight, description: e.target.value})}
                placeholder="Describe your highlight"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds): {currentHighlight.duration}s</Label>
              <Slider 
                id="duration"
                defaultValue={[currentHighlight.duration]} 
                min={10} 
                max={120} 
                step={5}
                onValueChange={(value) => setCurrentHighlight({...currentHighlight, duration: value[0]})} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Key Moments</Label>
                <Button variant="outline" size="sm" onClick={addMoment}>
                  <Plus className="h-4 w-4 mr-1" /> Add Moment
                </Button>
              </div>
              
              {currentHighlight.moments.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md border-gray-300">
                  <p className="text-gray-500">No moments added yet</p>
                  <Button variant="ghost" size="sm" onClick={addMoment} className="mt-2">
                    <Plus className="h-4 w-4 mr-1" /> Add your first moment
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentHighlight.moments
                    .sort((a, b) => a.time - b.time)
                    .map((moment) => (
                    <div 
                      key={moment.id} 
                      className={`flex items-center justify-between p-2 rounded-md border ${
                        selectedMoment === moment.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedMoment(moment.id)}
                    >
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`mr-2 ${getTeamColor(moment.teamId)} text-white`}
                        >
                          {moment.time}'
                        </Badge>
                        <span className="mr-2">{getMomentTypeDetails(moment.type).icon}</span>
                        <div>
                          <p className="font-medium text-sm">{moment.title}</p>
                          <p className="text-xs text-gray-500">{getTeamName(moment.teamId)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMoment(moment.id);
                            setIsDialogOpen(true);
                          }}
                        >
                          <span className="sr-only">Edit</span>
                          <pencil-icon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMoment(moment.id);
                          }}
                        >
                          <span className="sr-only">Delete</span>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentHighlight({
                  id: crypto.randomUUID(),
                  title: `${match.teams.home.name} vs ${match.teams.away.name} Highlights`,
                  description: 'User generated highlights',
                  moments: [],
                  matchId: match.fixture.id,
                  creator: 'You',
                  createdAt: new Date(),
                  likes: 0,
                  duration: DEFAULT_DURATION
                });
                setEditMode(false);
              }}
            >
              Reset
            </Button>
            <Button 
              onClick={saveHighlight}
              disabled={currentHighlight.moments.length === 0}
            >
              <Save className="h-4 w-4 mr-1" />
              {editMode ? 'Update Highlight' : 'Save Highlight'}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="explore">
          <CardContent>
            {highlights.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-md border-gray-300">
                <p className="text-gray-500 mb-2">No highlights created yet</p>
                <Button onClick={() => setActiveTab('create')}>
                  Create Your First Highlight
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {highlights.map((highlight) => (
                  <Card key={highlight.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{highlight.title}</CardTitle>
                        <div className="text-xs text-gray-500">
                          {highlight.moments.length} moments • {highlight.duration}s
                        </div>
                      </div>
                      <CardDescription>
                        Created by {highlight.creator} • {new Date(highlight.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm mb-2">{highlight.description}</p>
                      <div className="flex overflow-x-auto pb-2 space-x-1">
                        {highlight.moments
                          .sort((a, b) => a.time - b.time)
                          .map((moment) => (
                          <Badge 
                            key={moment.id} 
                            variant="outline" 
                            className={`flex-shrink-0 ${getTeamColor(moment.teamId)} text-white`}
                          >
                            {moment.time}' {getMomentTypeDetails(moment.type).icon} {moment.title}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editHighlight(highlight)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setHighlights(highlights.filter(h => h.id !== highlight.id));
                          }}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => shareHighlight(highlight)}
                      >
                        <Share2 className="h-4 w-4 mr-1" /> Share
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      {/* Moment editing dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Moment</DialogTitle>
            <DialogDescription>
              Customize this highlight moment
            </DialogDescription>
          </DialogHeader>
          
          {selectedMoment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moment-title">Title</Label>
                <Input 
                  id="moment-title" 
                  value={currentHighlight.moments.find(m => m.id === selectedMoment)?.title || ''}
                  onChange={(e) => {
                    const updatedMoment = {...currentHighlight.moments.find(m => m.id === selectedMoment)!, title: e.target.value};
                    updateMoment(updatedMoment);
                  }}
                  placeholder="Moment title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="moment-time">Time (minute)</Label>
                  <Input 
                    id="moment-time" 
                    type="number"
                    min="0"
                    max="120"
                    value={currentHighlight.moments.find(m => m.id === selectedMoment)?.time || 0}
                    onChange={(e) => {
                      const updatedMoment = {
                        ...currentHighlight.moments.find(m => m.id === selectedMoment)!, 
                        time: parseInt(e.target.value) || 0
                      };
                      updateMoment(updatedMoment);
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="moment-type">Type</Label>
                  <select 
                    id="moment-type"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={currentHighlight.moments.find(m => m.id === selectedMoment)?.type || 'other'}
                    onChange={(e) => {
                      const updatedMoment = {
                        ...currentHighlight.moments.find(m => m.id === selectedMoment)!, 
                        type: e.target.value as HighlightMoment['type']
                      };
                      updateMoment(updatedMoment);
                    }}
                  >
                    {momentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="moment-team">Team</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant={currentHighlight.moments.find(m => m.id === selectedMoment)?.teamId === match.teams.home.id ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      const updatedMoment = {
                        ...currentHighlight.moments.find(m => m.id === selectedMoment)!, 
                        teamId: match.teams.home.id
                      };
                      updateMoment(updatedMoment);
                    }}
                  >
                    <img 
                      src={match.teams.home.logo} 
                      alt={match.teams.home.name} 
                      className="w-5 h-5 mr-2"
                    />
                    {match.teams.home.name}
                  </Button>
                  
                  <Button 
                    variant={currentHighlight.moments.find(m => m.id === selectedMoment)?.teamId === match.teams.away.id ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      const updatedMoment = {
                        ...currentHighlight.moments.find(m => m.id === selectedMoment)!, 
                        teamId: match.teams.away.id
                      };
                      updateMoment(updatedMoment);
                    }}
                  >
                    <img 
                      src={match.teams.away.logo} 
                      alt={match.teams.away.name} 
                      className="w-5 h-5 mr-2"
                    />
                    {match.teams.away.name}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="moment-description">Description</Label>
                <Textarea 
                  id="moment-description" 
                  value={currentHighlight.moments.find(m => m.id === selectedMoment)?.description || ''}
                  onChange={(e) => {
                    const updatedMoment = {
                      ...currentHighlight.moments.find(m => m.id === selectedMoment)!, 
                      description: e.target.value
                    };
                    updateMoment(updatedMoment);
                  }}
                  placeholder="Describe what happened"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const updatedMoment = currentHighlight.moments.find(m => m.id === selectedMoment)!;
                updateMoment(updatedMoment);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}