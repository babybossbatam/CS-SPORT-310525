
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MyBasketFeatured from '@/components/matches/MyBasketFeatured';
import MyBasketTopScorer from '@/components/leagues/MyBasketTopScorer';
import MyBasketStandings from '@/components/leagues/MyBasketStandings';
import MyBasketPopularLeagues from '@/components/leagues/MyBasketPopularLeagues';
import MyBasketPopularTeams from '@/components/teams/MyBasketPopularTeams';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyMainLayoutRight from '@/components/layout/MyMainLayoutRight';


const MyRightBasket: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  return (
    <>
      {/* Basketball featured match component */}
      <MyBasketFeatured 
        selectedDate={selectedDate} 
        maxMatches={8}
      />

      <MyBasketTopScorer />

      <MyBasketStandings />

      {/* Popular Basketball Leagues and Teams sections */}
      <div className="grid grid-cols-2 gap-4">
        <MyBasketPopularLeagues />
        <Card className="w-full shadow-md bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Popular Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-4">
            <MyBasketPopularTeams />
          </CardContent>
        </Card>
      </div>
    </>

  );
};


export default MyRightBasket;
export { MyMainLayoutRight as MyRightDetails };
