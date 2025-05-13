
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Futbol, CircleDot, CircleDashed, PuckIcon, Tennis } from 'lucide-react';

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
        <div className="flex items-center space-x-6">
          <button
            onClick={() => handleSportSelect('football')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2',
              selectedSport === 'football'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Futbol className="h-4 w-4" />
            <span>Football</span>
          </button>

          <button
            onClick={() => handleSportSelect('basketball')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2',
              selectedSport === 'basketball'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <CircleDashed className="h-4 w-4" />
            <span>Basketball</span>
          </button>

          <button
            onClick={() => handleSportSelect('baseball')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2',
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
              'px-3 py-4 text-sm font-medium flex items-center space-x-2',
              selectedSport === 'hockey'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <PuckIcon className="h-4 w-4" />
            <span>Hockey</span>
          </button>

          <button
            onClick={() => handleSportSelect('tennis')}
            className={cn(
              'px-3 py-4 text-sm font-medium flex items-center space-x-2',
              selectedSport === 'tennis'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Tennis className="h-4 w-4" />
            <span>Tennis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { SportsCategoryTabs };
export { SportsCategoryTabs as default };
