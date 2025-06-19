import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

interface MatchEndedDetailsCardProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

const MatchEndedDetailsCard: React.FC<MatchEndedDetailsCardProps> = ({
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
}) => {
  const [showHighlights, setShowHighlights] = useState(false);

  // Sample highlight videos for different ended matches
  const getHighlightVideo = () => {
    const highlightVideos = [
      {
        id: "PafEQYZjA58",
        title: "Al Ain FC vs Juventus (0-5) | Resumen | Highlights Mundial de Clubes FIFA 2025™",
        teams: "Al Ain vs Juventus",
        result: "0-5"
      },
      {
        id: "K4DyBUG242c", // Real Madrid vs Liverpool Champions League Final
        title: "Real Madrid vs Liverpool (1-0) | Champions League Final Highlights",
        teams: "Real Madrid vs Liverpool",
        result: "1-0"
      },
      {
        id: "HIzbryMEKB8", // Manchester City vs Inter Milan
        title: "Manchester City vs Inter Milan (1-0) | Champions League Final Highlights",
        teams: "Manchester City vs Inter Milan",
        result: "1-0"
      },
      {
        id: "fFeg_hl0Se4", // Chelsea vs Real Madrid
        title: "Chelsea vs Real Madrid (2-0) | Champions League Highlights",
        teams: "Chelsea vs Real Madrid",
        result: "2-0"
      },
      {
        id: "JuK9fV5lAHs", // Barcelona vs PSG
        title: "Barcelona vs PSG (4-1) | Champions League Highlights",
        teams: "Barcelona vs PSG",
        result: "4-1"
      },
      {
        id: "UOvZKJlrtk8", // Bayern Munich vs Barcelona
        title: "Bayern Munich vs Barcelona (8-2) | Champions League Highlights",
        teams: "Bayern Munich vs Barcelona",
        result: "8-2"
      }
    ];

    // You can implement logic to match based on team names
    // For now, let's try to match with the provided teams or return a random one
    const matchingVideo = highlightVideos.find(video => 
      video.teams.toLowerCase().includes(homeTeam.toLowerCase()) || 
      video.teams.toLowerCase().includes(awayTeam.toLowerCase())
    );

    return matchingVideo || highlightVideos[Math.floor(Math.random() * highlightVideos.length)];
  };

  const highlightVideo = getHighlightVideo();

  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-600 font-normal">Match Ended</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Result</h3>

          <div className="flex items-center justify-center gap-4">
            {/* Home Team Button */}
            <Button
              variant="outline"
              className="flex-1 max-w-[150px] h-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {homeTeamLogo && (
                  <img 
                    src={homeTeamLogo} 
                    alt={homeTeam}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-sm font-medium truncate">
                  {homeTeam.length > 10 ? `${homeTeam.substring(0, 10)}...` : homeTeam}
                </span>
              </div>
            </Button>

            {/* Draw Button */}
            <Button
              variant="outline"
              className="px-8 h-12 rounded-full border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Draw</span>
            </Button>

            {/* Away Team Button */}
            <Button
              variant="outline"
              className="flex-1 max-w-[150px] h-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {awayTeamLogo && (
                  <img 
                    src={awayTeamLogo} 
                    alt={awayTeam}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-sm font-medium truncate">
                  {awayTeam.length > 10 ? `${awayTeam.substring(0, 10)}...` : awayTeam}
                </span>
              </div>
            </Button>
          </div>

          {/* Match result indicators */}
          <div className="flex justify-center mt-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Highlights Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-md font-semibold text-gray-800">Match Highlights</h4>
              <p className="text-xs text-gray-500">
                {highlightVideo.teams} ({highlightVideo.result})
              </p>
            </div>
            {!showHighlights && (
              <Button
                onClick={() => setShowHighlights(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
              >
                <Play className="w-4 h-4 text-blue-600" />
                <span className="text-blue-600 font-medium">Watch</span>
              </Button>
            )}
            {showHighlights && (
              <Button
                onClick={() => setShowHighlights(false)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-medium">Close</span>
              </Button>
            )}
          </div>

          {showHighlights && (
            <div className="mb-4">
              <div className="relative w-full rounded-lg overflow-hidden shadow-lg bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${highlightVideo.id}?autoplay=0&mute=0&controls=1&showinfo=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
                  title={highlightVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  loading="lazy"
                />
                
                {/* Team logos and score overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                  <div className="flex items-center space-x-3">
                    {/* Home team logo and score */}
                    <div className="flex items-center space-x-2 bg-black bg-opacity-60 rounded-lg px-3 py-2">
                      {homeTeamLogo && (
                        <img 
                          src={homeTeamLogo} 
                          alt={homeTeam}
                          className="w-8 h-8 object-contain rounded"
                        />
                      )}
                      <span className="text-white font-bold text-2xl">
                        {highlightVideo.result.split('-')[0]}
                      </span>
                    </div>
                    
                    {/* VS Divider */}
                    <div className="text-white font-bold text-lg bg-black bg-opacity-60 rounded px-2 py-1">
                      -
                    </div>
                    
                    {/* Away team logo and score */}
                    <div className="flex items-center space-x-2 bg-black bg-opacity-60 rounded-lg px-3 py-2">
                      <span className="text-white font-bold text-2xl">
                        {highlightVideo.result.split('-')[1]}
                      </span>
                      {awayTeamLogo && (
                        <img 
                          src={awayTeamLogo} 
                          alt={awayTeam}
                          className="w-8 h-8 object-contain rounded"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Official Highlights badge */}
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                  Official Highlights
                </div>

                {/* Bottom info overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
                  <div className="bg-black bg-opacity-70 rounded-lg p-3">
                    <h4 className="text-white font-semibold text-sm mb-1">
                      {highlightVideo.teams}
                    </h4>
                    <p className="text-gray-300 text-xs">
                      Match Highlights • HD Quality
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {highlightVideo.title}
                </p>
                <p className="text-xs text-gray-600">
                  Official match highlights and key moments
                </p>
              </div>
            </div>
          )}

          {!showHighlights && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 text-center border border-blue-100">
              <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <h5 className="text-sm font-semibold text-gray-800 mb-1">
                Match Highlights Available
              </h5>
              <p className="text-xs text-gray-600 mb-3">
                Watch key moments, goals, and match summary
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>HD Quality</span>
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Official Highlights</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchEndedDetailsCard;