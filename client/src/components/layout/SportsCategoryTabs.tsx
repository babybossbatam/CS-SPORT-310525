
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Tv,
  Circle,
  CircleDashed,
  CircleDot,
  Trophy,
  Activity,
  PersonStanding,
  Shield,
  CircleOff,
  CircleEqual,
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
          <button
            onClick={() => handleSportSelect('tv')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'tv'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Tv className="h-4 w-4" />
            <span>TV</span>
          </button>

          <button
            onClick={() => handleSportSelect('football')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'football'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Circle className="h-4 w-4" />
            <span>Football</span>
          </button>

          <button
            onClick={() => handleSportSelect('basketball')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'basketball'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <CircleDashed className="h-4 w-4" />
            <span>Basketball</span>
          </button>

          <button
            onClick={() => handleSportSelect('cricket')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'cricket'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Trophy className="h-4 w-4" />
            <span>Cricket</span>
          </button>

          <button
            onClick={() => handleSportSelect('american-football')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'american-football'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Shield className="h-4 w-4" />
            <span>A.Football</span>
          </button>

          <button
            onClick={() => handleSportSelect('baseball')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'baseball'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <CircleDot className="h-4 w-4" />
            <span>Baseball</span>
          </button>

          <button
            onClick={() => handleSportSelect('hockey')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'hockey'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Activity className="h-4 w-4" />
            <span>Hockey</span>
          </button>

          <button
            onClick={() => handleSportSelect('tennis')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'tennis'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <CircleOff className="h-4 w-4" />
            <span>Tennis</span>
          </button>

          <button
            onClick={() => handleSportSelect('handball')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'handball'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <PersonStanding className="h-4 w-4" />
            <span>Handball</span>
          </button>

          <button
            onClick={() => handleSportSelect('volleyball')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'volleyball'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <CircleEqual className="h-4 w-4" />
            <span>Volleyball</span>
          </button>

          <button
            onClick={() => handleSportSelect('rugby')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2 whitespace-nowrap',
              selectedSport === 'rugby'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Hammer className="h-4 w-4" />
            <span>Rugby</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;
