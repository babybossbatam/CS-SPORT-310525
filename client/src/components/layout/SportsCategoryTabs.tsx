import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Tv,
  Circle,
  Basketball,
  Cricket,
  Shield,
  Baseball,
  Activity,
  Circle as Tennis,
  PersonStanding,
  Volleyball,
  Hammer
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
            { id: 'football', icon: Circle, label: 'Football' },
            { id: 'basketball', icon: Basketball, label: 'Basketball' },
            { id: 'cricket', icon: Cricket, label: 'Cricket' },
            { id: 'american-football', icon: Shield, label: 'A.Football' },
            { id: 'baseball', icon: Baseball, label: 'Baseball' },
            { id: 'hockey', icon: Activity, label: 'Hockey' },
            { id: 'tennis', icon: Tennis, label: 'Tennis' },
            { id: 'handball', icon: PersonStanding, label: 'Handball' },
            { id: 'volleyball', icon: Volleyball, label: 'Volleyball' },
            { id: 'rugby', icon: Hammer, label: 'Rugby' }
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