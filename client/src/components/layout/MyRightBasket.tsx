
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
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
        <div className="w-full shadow-md bg-white">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">Popular Basketball Teams</h3>
            <MyBasketPopularTeams />
          </div>
        </div>
      </div>
    </>

  );
};


export default MyRightBasket;
export { MyMainLayoutRight as MyRightDetails };
