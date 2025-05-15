
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
    <Card className="rounded-none border-x-0 shadow-lg fixed left-0 right-0 z-50 top-0 w-full bg-white/95 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-0">
            {sportsList.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleSportSelect(id)}
                className={cn(
                  'flex flex-col items-center px-1.5 py-1 min-w-[40px] transition-all duration-200 ease-in-out hover:scale-110',
                  selectedSport === id
                    ? 'text-[#15222A] hover:text-[#15222A]/80'
                    : 'text-[#6B7173] hover:text-[#15222A] hover:bg-gray-50/50'
                )}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span className="text-[9px] font-normal">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;
