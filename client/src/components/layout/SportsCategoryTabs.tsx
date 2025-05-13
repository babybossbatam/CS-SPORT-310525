import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Tv,
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

const SportsCategoryTabs = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);

  const handleSportSelect = (sport: string) => {
    dispatch(uiActions.setSelectedSport(sport));
    navigate(`/${sport.toLowerCase()}`);
  };

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-5 overflow-x-auto py-2.5">
          {[
            { id: 'tv', icon: Tv, label: 'TV' },
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
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleSportSelect(id)}
              className={cn(
                'px-3 flex flex-col items-center justify-center whitespace-nowrap',
                selectedSport === id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <div className={cn(
                'rounded-full w-8 h-8 mb-1 flex items-center justify-center',
                selectedSport === id
                  ? 'bg-blue-50 border border-blue-100'
                  : 'bg-gray-50 border border-gray-100'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;