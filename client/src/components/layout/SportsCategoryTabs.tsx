
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
    { id: 'american-football', icon: AmericanFootballIcon, label: 'A.Football' },
    { id: 'baseball', icon: BaseballIcon, label: 'Baseball' },
    { id: 'hockey', icon: HockeyIcon, label: 'Hockey' },
    { id: 'tennis', icon: TennisIcon, label: 'Tennis' },
    { id: 'handball', icon: HandballIcon, label: 'Handball' },
    { id: 'volleyball', icon: VolleyballIcon, label: 'Volleyball' },
    { id: 'rugby', icon: RugbyIcon, label: 'Rugby' }
  ];

  return (
    <Card className="rounded-lg border shadow-lg fixed left-1/2 transform -translate-x-1/2 z-40 top-[80px] w-[98%] max-w-7xl bg-white/95 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex justify-between px-1 py-0 min-w-max">
            {sportsList.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleSportSelect(id)}
                className={cn(
                  'flex flex-col items-center px-2 py-1.5 min-w-[50px]',
                  selectedSport === id
                    ? 'text-[#15222A]'
                    : 'text-[#6B7173]'
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-normal">{label}</span>
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
