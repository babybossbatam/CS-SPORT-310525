import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
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

// Define a type for our sport items
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

  // Define our sports list
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
    <div className="border-b border-gray-100">
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
    </div>
  );
};

// Make sure we have both named export and default export
export { SportsCategoryTabs };
export default SportsCategoryTabs;