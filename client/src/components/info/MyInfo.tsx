import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";

const MyInfo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="-px-1">
      <CardHeader>
        <CardTitle className="text-sm font-semibold -mb-2 -mt-2 ">
          Football at CS SPORT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-gray-700 space-y-3 ">
          <p>
            Welcome to CS SPORT – your ultimate destination for everything
            Football! Stay on top of the action with live scores from over 1,000
            competitions worldwide, including today's hottest matches from the
            UEFA Champions League Qualifiers, UEFA Champions League, and the
            Premier League.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm">
                Explore Your Favorite Teams & Players
              </h3>
              <p className="text-xs text-gray-600">
                Want to know how FC Barcelona, Real Madrid, or Manchester United
                are doing? Dive into the latest results, upcoming fixtures,
                league standings, breaking news, match highlights, and in-depth
                stats for top stars like Lionel Messi, Cristiano Ronaldo, and
                Lamine Yamal.
              </p>
            </div>
          </div>

          <div className="">
            <h3 className="font-bold text-gray-900 mb-2">
              Why Choose CS SPORT?
            </h3>
            <p className="text-xs text-gray-600">
              <li>
                All-in-One Platform: Get the latest news, fixtures, standings,
                results, and live scores for leagues, cups, and tournaments
                around the globe.
              </li>
              <li>
                Track Your Favorites: Follow your teams and players, and never
                miss a moment. Smart Predictions: Use our insights and tips to
                make better Football predictions and outsmart your friends!
              </li>
              <li>
                Smart Predictions: Use our insights and tips to make better
                Football predictions and outsmart your friends.
              </li>
            </p>
            <div>
              <p className="text-xs text-gray-600 mt-2">
                Ready to experience Football like never before?
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-12 text-sm">
                Start exploring now and join the CS SPORT community!
              </h3>

              {/* Toggle Button - Full Width - Only show when collapsed */}
              {!isExpanded && (
                <button
                  onClick={toggleExpanded}
                  className="w-full flex items-center justify-center  py-2 -mb-6 border-t border-b border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <span>Football Info</span>
                  <ChevronDown size={18} />
                </button>
              )}

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 my-2 text-sm">
                    Football FAQ
                  </h3>

                  <div className="text-xs text-gray-600 space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-800 my-2 text-xs">
                        Who invented Football?
                      </h3>
                      <p>
                        Football's roots go way back! While ball games have been
                        played for centuries across the world, the modern game
                        was shaped in England in the 19th century. The English
                        Football Association set the official rules in 1863,
                        giving us the Football we know and love today.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 my-2 text-xs">
                        Where was Football invented?
                      </h3>
                      <p>
                        The modern version of Football was born in England.
                        Although similar games existed globally, it was in
                        England where the rules were standardized, making it the
                        home of modern Football.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 my-2 text-xs">
                        What is the length of a Football pitch?
                      </h3>
                      <p>
                        Great question! A standard Football pitch is
                        rectangular, ranging from 90–120 meters in length and
                        45–90 meters in width, as set by the International
                        Football Association Board (IFAB). These dimensions are
                        used for professional and international matches.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 my-2 text-xs">
                        Who is the best Football player in the world?
                      </h3>
                      <p>
                        This is always up for debate! Legends like Pelé, Diego
                        Maradona, Lionel Messi, and Cristiano Ronaldo have all
                        left their mark. Each has a unique style and legacy, so
                        the "best" often depends on who you ask!
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 my-2 text-xs">
                        Want more Football fun?
                      </h3>
                      <p>
                        Check out live stats, highlights, and join the
                        conversation with fans worldwide – only on
                      </p>
                      <h3 className="font-medium text-gray-800 my-2 text-xs">
                        CS SPORT! 🚀
                      </h3>
                    </div>
                  </div>

                  {/* Show Less Button at the bottom */}
                  <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-center gap-2 py-2 border-t border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 -mb-6"
                  >
                    <span>Show Less</span>
                    <ChevronUp size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyInfo;
