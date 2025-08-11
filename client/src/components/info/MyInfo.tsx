import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";

const MyInfo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentLanguage } = useLanguage();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const translateText = (text: string): string => {
    return smartLeagueCountryTranslation.translateLeagueName(text, currentLanguage);
  };

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-sm font-semibold -mb-2 -mt-2 text-gray-900 dark:text-white">
          {translateText("Football at CS SPORT")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="text-xs text-gray-700 dark:text-white space-y-3 px-6 pb-0">
          <p>
            {translateText("Welcome to CS SPORT – your ultimate destination for everything Football! Stay on top of the action with live scores from over 1,000 competitions worldwide, including today's hottest matches from the UEFA Champions League Qualifiers, UEFA Champions League, and the Premier League.")}
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-xs">
                {translateText("Explore Your Favorite Teams & Players")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-white">
                {translateText("Want to know how FC Barcelona, Real Madrid, or Manchester United are doing? Dive into the latest results, upcoming fixtures, league standings, breaking news, match highlights, and in-depth stats for top stars like Lionel Messi, Cristiano Ronaldo, and Lamine Yamal.")}
              </p>
            </div>
          </div>

          <div className="">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              {translateText("Why Choose CS SPORT?")}
            </h3>
            <p className="text-xs text-gray-600 dark:text-white">
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-600 dark:bg-white rounded-full mr-3"></span>
                {translateText("All-in-One Platform: Get the latest news, fixtures, standings, results, and live scores for leagues, cups, and tournaments around the globe.")}
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-600 dark:bg-white rounded-full mr-3"></span>
                {translateText("Track Your Favorites: Follow your teams and players, and never miss a moment.")}
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-600 dark:bg-white rounded-full mr-3"></span>
                {translateText("Smart Predictions: Use our insights and tips to make better Football predictions and outsmart your friends.")}
              </li>
              
            </p>
            <div>
              <p className="text-xs text-gray-600 dark:text-white mt-2">
                {translateText("Ready to experience Football like never before?")}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-12 text-sm">
                {translateText("Start exploring now and join the CS SPORT community!")}
              </h3>

              {/* Toggle Button - Full Width - Only show when collapsed */}
              {!isExpanded && (
                <div className="-mx-6">
                  <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-center gap-2 py-2 border-t border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <span>{translateText("Football Info")}</span>
                    <ChevronDown size={18} />
                  </button>
                </div>
              )}

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="space-y-4 -mx-6">
                  <h3 className="font-medium text-gray-800 dark:text-white text-sm px-6">
                    {translateText("Football FAQ")}
                  </h3>

                  <div className="text-xs text-gray-600 dark:text-white space-y-3 px-6">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {translateText("Who invented Football?")}
                      </h3>
                      <p>
                        {translateText("Football's roots go way back! While ball games have been played for centuries across the world, the modern game was shaped in England in the 19th century. The English Football Association set the official rules in 1863, giving us the Football we know and love today.")}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {translateText("Where was Football invented?")}
                      </h3>
                      <p>
                        {translateText("The modern version of Football was born in England. Although similar games existed globally, it was in England where the rules were standardized, making it the home of modern Football.")}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {translateText("What is the length of a Football pitch?")}
                      </h3>
                      <p>
                        {translateText("Great question! A standard Football pitch is rectangular, ranging from 90–120 meters in length and 45–90 meters in width, as set by the International Football Association Board (IFAB). These dimensions are used for professional and international matches.")}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {translateText("Who is the best Football player in the world?")}
                      </h3>
                      <p>
                        {translateText("This is always up for debate! Legends like Pelé, Diego Maradona, Lionel Messi, and Cristiano Ronaldo have all left their mark. Each has a unique style and legacy, so the 'best' often depends on who you ask!")}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {translateText("Want more Football fun?")}
                      </h3>
                      <p>
                        {translateText("Check out live stats, highlights, and join the conversation with fans worldwide – only on")}
                      </p>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {translateText("CS SPORT!")} 🚀
                      </h3>
                    </div>
                  </div>

                  {/* Show Less Button at the bottom */}
                  <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-center gap-2 py-2 border-t border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 -mb-6"
                  >
                    <span>{translateText("Show Less")}</span>
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
