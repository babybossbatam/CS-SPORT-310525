import React, { useState } from 'react';
import { Film, Loader2, Download, Check, Camera, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getTeamColor } from '@/lib/colorExtractor';

interface HighlightGeneratorProps {
  matchId: number;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  score?: {
    home: number;
    away: number;
  };
  isMatchEnded: boolean;
}

type HighlightType = 'goals' | 'cards' | 'all' | 'top';
type ClipDuration = 15 | 30 | 45 | 60;

const HighlightGenerator: React.FC<HighlightGeneratorProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  league,
  score,
  isMatchEnded
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [highlightType, setHighlightType] = useState<HighlightType>('goals');
  const [clipDuration, setClipDuration] = useState<ClipDuration>(30);
  const [includeReplays, setIncludeReplays] = useState(true);
  const [includeCommentary, setIncludeCommentary] = useState(true);
  const { toast } = useToast();
  
  // Progress states for animation
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  const homeTeamColor = getTeamColor(homeTeam.name);
  const awayTeamColor = getTeamColor(awayTeam.name);
  
  const handleGenerate = async () => {
    if (!isMatchEnded) {
      toast({
        title: "Match not ended",
        description: "Highlights can only be generated after the match has ended.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setProgressPercentage(0);
    
    // Simulate highlight generation progress
    const interval = setInterval(() => {
      setProgressPercentage(prev => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 500);
    
    // Simulate API call for highlight generation
    setTimeout(() => {
      clearInterval(interval);
      setProgressPercentage(100);
      setIsGenerating(false);
      setIsGenerated(true);
      
      toast({
        title: "Highlights generated!",
        description: "Your personalized highlight clip is ready to watch.",
      });
    }, 3000);
  };
  
  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your highlights clip is being downloaded.",
    });
  };
  
  const handleShare = () => {
    toast({
      title: "Share link copied",
      description: "The link to your highlights has been copied to clipboard.",
    });
  };
  
  return (
    <Card className="w-full overflow-hidden shadow-md">
      <CardHeader className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          <CardTitle className="text-lg">Match Highlight Generator</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-center">
            <img 
              src={homeTeam.logo} 
              alt={homeTeam.name} 
              className="h-14 w-14 mb-1"
              style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' }}
            />
            <span className="text-sm font-semibold">{homeTeam.name}</span>
            {score && <span className="text-2xl font-bold">{score.home}</span>}
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-500 mb-1">VS</span>
            <img 
              src={league.logo} 
              alt={league.name} 
              className="h-8 w-8 mb-1" 
            />
            <span className="text-xs text-gray-500">{league.name}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <img 
              src={awayTeam.logo} 
              alt={awayTeam.name} 
              className="h-14 w-14 mb-1"
              style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' }}
            />
            <span className="text-sm font-semibold">{awayTeam.name}</span>
            {score && <span className="text-2xl font-bold">{score.away}</span>}
          </div>
        </div>
        
        {/* Highlight Options */}
        <div className="space-y-4 my-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Highlight Type</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button 
                variant={highlightType === 'goals' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHighlightType('goals')}
              >
                Goals Only
              </Button>
              <Button 
                variant={highlightType === 'cards' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHighlightType('cards')}
              >
                Cards & Fouls
              </Button>
              <Button 
                variant={highlightType === 'top' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHighlightType('top')}
              >
                Top Moments
              </Button>
              <Button 
                variant={highlightType === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHighlightType('all')}
              >
                All Highlights
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Clip Duration: {clipDuration} seconds</h3>
            <Slider
              defaultValue={[30]}
              min={15}
              max={60}
              step={15}
              onValueChange={(value) => setClipDuration(value[0] as ClipDuration)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="replays"
                checked={includeReplays}
                onCheckedChange={setIncludeReplays}
              />
              <Label htmlFor="replays">Include Replays</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="commentary"
                checked={includeCommentary}
                onCheckedChange={setIncludeCommentary}
              />
              <Label htmlFor="commentary">Include Commentary</Label>
            </div>
          </div>
        </div>
        
        {/* Generation Progress */}
        {isGenerating && (
          <div className="my-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Generating highlight clip...</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundImage: `linear-gradient(to right, ${homeTeamColor}, ${awayTeamColor})` 
                }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Buttons */}
        <div className="flex flex-col space-y-2 mt-4">
          {!isGenerated ? (
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Generate Highlight Clip
                </>
              )}
            </Button>
          ) : (
            <>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" />
                Watch Highlights
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
        Note: Generated highlights are subject to copyright and available for personal use only.
      </CardFooter>
    </Card>
  );
};

export default HighlightGenerator;