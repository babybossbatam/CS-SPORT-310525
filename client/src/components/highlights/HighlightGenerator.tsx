import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Video, Clock, Download, Share2, Film, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FixtureResponse } from '@/types/fixtures';

interface HighlightGeneratorProps {
  match: FixtureResponse;
}

// Key moments to automatically detect and include in highlights
const KEY_MOMENT_TYPES = [
  { id: 'goals', label: 'Goals', default: true },
  { id: 'redCards', label: 'Red Cards', default: true },
  { id: 'penalties', label: 'Penalties', default: true },
  { id: 'bigChances', label: 'Big Chances', default: false },
  { id: 'saves', label: 'Key Saves', default: false },
  { id: 'skills', label: 'Skill Moves', default: false },
];

export function HighlightGenerator({ match }: HighlightGeneratorProps) {
  const { toast } = useToast();
  const [selectedMoments, setSelectedMoments] = useState(
    KEY_MOMENT_TYPES.filter(m => m.default).map(m => m.id)
  );
  const [clipLength, setClipLength] = useState(3);
  const [clipTitle, setClipTitle] = useState(`${match.teams.home.name} vs ${match.teams.away.name} Highlights`);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedClip, setGeneratedClip] = useState<string | null>(null);

  // Toggle selected moment type
  const toggleMomentType = (momentType: string) => {
    if (selectedMoments.includes(momentType)) {
      setSelectedMoments(selectedMoments.filter(m => m !== momentType));
    } else {
      setSelectedMoments([...selectedMoments, momentType]);
    }
  };

  // Simulate highlight clip generation
  const generateHighlight = () => {
    if (selectedMoments.length === 0) {
      toast({
        title: "No moments selected",
        description: "Please select at least one type of moment to include in highlights",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setGeneratedClip(null);

    // Simulate progress updates
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setGenerating(false);
          // Create a "fake" video URL - in a real app, this would be an actual video file
          const timestamp = new Date().getTime();
          setGeneratedClip(`highlight-${match.fixture.id}-${timestamp}.mp4`);
          
          toast({
            title: "Highlight Generation Complete",
            description: "Your personalized highlight clip is ready to watch!",
          });
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  // Simulate sharing highlight clip
  const shareHighlight = () => {
    if (!generatedClip) return;
    
    toast({
      title: "Share Link Copied",
      description: "The link to your highlight clip has been copied to clipboard",
    });
  };

  // Simulate downloading highlight clip
  const downloadHighlight = () => {
    if (!generatedClip) return;
    
    toast({
      title: "Downloading Highlight",
      description: "Your highlight clip is being downloaded",
    });
  };

  return (
    <Card className="w-full shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-white">
          <Sparkles className="h-5 w-5 mr-2" />
          One-Click Highlight Generator
        </CardTitle>
        <CardDescription className="text-gray-100">
          Generate custom game highlights in seconds
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {!generatedClip ? (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center">
                <Film className="h-4 w-4 mr-2" />
                Highlight Title
              </h3>
              <Input
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder="Enter a title for your highlight clip"
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Clip Length: {clipLength} minutes
              </h3>
              <div className="flex items-center justify-between space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setClipLength(Math.max(1, clipLength - 1))}
                  disabled={clipLength <= 1}
                >
                  -
                </Button>
                <Progress value={(clipLength / 10) * 100} className="h-2" />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setClipLength(Math.min(10, clipLength + 1))}
                  disabled={clipLength >= 10}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Include Key Moments
              </h3>
              <div className="flex flex-wrap gap-2">
                {KEY_MOMENT_TYPES.map((moment) => (
                  <Badge
                    key={moment.id}
                    variant={selectedMoments.includes(moment.id) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      selectedMoments.includes(moment.id) 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => toggleMomentType(moment.id)}
                  >
                    {moment.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            {generating ? (
              <div className="space-y-3 py-4">
                <h3 className="text-sm font-semibold text-center">Generating Your Highlight...</h3>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-center text-gray-500">
                  {generationProgress < 30 && "Analyzing match footage..."}
                  {generationProgress >= 30 && generationProgress < 60 && "Detecting key moments..."}
                  {generationProgress >= 60 && generationProgress < 90 && "Creating highlight sequence..."}
                  {generationProgress >= 90 && "Finalizing your clip..."}
                </p>
              </div>
            ) : (
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
                onClick={generateHighlight}
              >
                <Video className="h-5 w-5 mr-2" />
                Generate Highlight
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
              <Play className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
              <div className="absolute bottom-3 left-3 text-white z-10">
                <h3 className="font-bold">{clipTitle}</h3>
                <p className="text-sm opacity-80">{clipLength} min • Generated {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <Badge variant="outline" className="bg-gray-100">
                {match.teams.home.name} vs {match.teams.away.name}
              </Badge>
              <Badge variant="outline" className="bg-gray-100">
                {match.league.name}
              </Badge>
              {selectedMoments.map((moment) => (
                <Badge key={moment} variant="outline" className="bg-gray-100">
                  {KEY_MOMENT_TYPES.find(m => m.id === moment)?.label}
                </Badge>
              ))}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setGeneratedClip(null)} className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                New Highlight
              </Button>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={shareHighlight} className="flex items-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={downloadHighlight} className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
        Powered by AI highlight detection • Match ID: {match.fixture.id}
      </CardFooter>
    </Card>
  );
}