import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  TvIcon,
  FootballIcon,
  BasketballIcon,
  CricketIcon,
  AmericanFootballIcon,
  BaseballIcon,
  HockeyIcon,
  TennisIcon,
  HandballIcon,
  VolleyballIcon,
  RugbyIcon
} from '@/components/icons/SportIcons';

type SportItem = {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
};

const SportsCategoryTabs = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);

  const handleSportSelect = (sport: string) => {
    dispatch(uiActions.setSelectedSport(sport));
    navigate(`/${sport.toLowerCase()}`);
  };

  const sportsList: SportItem[] = [
    { id: 'tv', icon: TvIcon, label: 'TV' },
    { id: 'football', icon: FootballIcon, label: 'Football' },
    { id: 'basketball', icon: BasketballIcon, label: 'Basketball' },
    { id: 'cricket', icon: CricketIcon, label: 'Cricket' },
    { id: 'baseball', icon: BaseballIcon, label: 'Baseball' },
    { id: 'tennis', icon: TennisIcon, label: 'Tennis' },
    { id: 'handball', icon: HandballIcon, label: 'Handball' },
    { id: 'volleyball', icon: VolleyballIcon, label: 'Volleyball' }
  ];

  return (
    <Card className="rounded-none border-b shadow-lg fixed left-0 z-50 top-[72px] w-full bg-white/95 backdrop-blur-sm">
        <div className="flex flex-row items-center p-1 ml-[150px]">
          {sportsList.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              onClick={() => handleSportSelect(id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 ease-in-out',
                selectedSport === id
                  ? 'text-[#15222A]'
                  : 'text-[#6B7173] hover:text-[#15222A]'
              )}
            >
              <Icon className="h-[1.1rem] w-[1.1rem]" />
              <span className="text-[0.94rem] font-normal">{label}</span>
            </div>
          ))}
        </div>
    </Card>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;