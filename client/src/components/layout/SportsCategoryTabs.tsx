import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Tv,
  Trophy,
  CircleDashed,
  BadgeAlert,
  ShieldAlert,
  CircleDot,
  Snowflake,
  Bike,
  Hand,
  Gauge,
  Activity
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
        <div className="flex items-center space-x-6 overflow-x-auto pb-1">
          {[
            { id: 'tv', icon: Tv, label: 'TV' },
            { id: 'football', icon: Trophy, label: 'Football' },
            { id: 'basketball', icon: CircleDashed, label: 'Basketball' },
            { id: 'cricket', icon: BadgeAlert, label: 'Cricket' },
            { id: 'american-football', icon: ShieldAlert, label: 'A.Football' },
            { id: 'baseball', icon: CircleDot, label: 'Baseball' },
            { id: 'hockey', icon: Snowflake, label: 'Hockey' },
            { id: 'tennis', icon: Bike, label: 'Tennis' },
            { id: 'handball', icon: Hand, label: 'Handball' },
            { id: 'volleyball', icon: Gauge, label: 'Volleyball' },
            { id: 'rugby', icon: Activity, label: 'Rugby' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleSportSelect(id)}
              className={cn(
                'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
                selectedSport === id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;