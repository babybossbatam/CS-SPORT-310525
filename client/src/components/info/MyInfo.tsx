
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MyInfo: React.FC = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Football at CS SPORT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700 space-y-3">
          <p>
            Football live scores by CS SPORT, covering over 1,000 competitions with all today's matches from top competitions including UEFA Champions League Qualifiers, UEFA Champions League, and Premier League.
          </p>
          
          <p>
            You can also find detailed information about FC Barcelona, Real Madrid, and Manchester United, with the latest results, fixtures, standings, news, highlights, and performance statistics about top athletes like Lionel Messi, Cristiano Ronaldo, and Lamine Yamal.
          </p>
          
          <p>
            CS SPORT is a platform that allows sports fans around the world to stay up to date with all Football essentials, including the latest news, fixtures, standings, results, and live scores of various leagues, cups, and tournaments.
            It offers comprehensive coverage of events worldwide and enables fans to track their favorite teams and players, making better Football predictions with insights and tips.
          </p>
          
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Football FAQ</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Who invented Football?</h4>
                <p className="text-xs text-gray-600">
                  The invention of Football cannot be attributed to a single person, as various forms of ball games have been played for centuries in different parts of the world. However, the modern version of the game as we know it today was developed in England in the 19th century. The rules of Football were standardized by the English Football Association in 1863, which helped to establish the modern game. Therefore, while the origins of Football are ancient and diverse, the modern game can be said to have been invented in England.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Where was Football invented?</h4>
                <p className="text-xs text-gray-600">
                  The origins of Football can be traced back to various ball games played in different parts of the world for centuries. However, the modern version of the game as we know it today was developed in England in the 19th century. The rules of Football were standardized by the English Football Association in 1863, which helped to establish the modern game. Therefore, Football was invented in England.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">What is the length of the Football pitch?</h4>
                <p className="text-xs text-gray-600">
                  The length of a Football pitch can vary depending on the level of play and the governing body's regulations. However, the standard dimensions for a Football field are defined by the International Football Association Board (IFAB). A Football pitch should be rectangular and between 90–120 meters in length and 45–90 meters in width. These dimensions are applicable for professional and international matches.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Who is the best Football player in the world?</h4>
                <p className="text-xs text-gray-600">
                  Numerous Football players have achieved great success and are considered some of the best in Football history, including Pelé, Diego Maradona, Lionel Messi, Cristiano Ronaldo, and others. These players possess their own distinct styles and abilities, and determining the greatest player can be subjective, influenced by personal inclinations and the standards used to assess their accomplishments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyInfo;
