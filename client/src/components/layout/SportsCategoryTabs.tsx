import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Trophy,
  CircleDashed,
  Target,
  Dumbbell,
  CircleDot,
  Snowflake,
  Bike,
  Hand,
  Disc,
  Feather
} from 'lucide-react';
import TvIcon from '@/components/icons/TvIcon';

// Define a type for our sport items
type SportItem = {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  customIcon?: boolean;
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
    { id: 'tv', icon: TvIcon, label: 'TV', customIcon: true },
    { id: 'football', icon: Trophy, label: 'Football' },
    { id: 'basketball', icon: CircleDashed, label: 'Basketball' },
    { id: 'cricket', icon: Target, label: 'Cricket' },
    { id: 'american-football', icon: Dumbbell, label: 'A.Football' },
    { id: 'baseball', icon: CircleDot, label: 'Baseball' },
    { id: 'hockey', icon: Snowflake, label: 'Hockey' },
    { id: 'tennis', icon: Bike, label: 'Tennis' },
    { id: 'handball', icon: Hand, label: 'Handball' },
    { id: 'volleyball', icon: Disc, label: 'Volleyball' },
    { id: 'rugby', icon: Feather, label: 'Rugby' }
  ];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex justify-between px-1 py-2 min-w-max">
          {sportsList.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleSportSelect(id)}
              className={cn(
                'flex flex-col items-center px-3 py-1 min-w-[55px]',
                selectedSport === id
                  ? 'text-blue-600'
                  : 'text-gray-600'
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">{label}</span>
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