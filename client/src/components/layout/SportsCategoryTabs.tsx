import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  TvIcon,
  FootballIcon,
  BasketballIcon,
  HorseRacingIcon,
  AmericanFootballIcon,
  SnookerIcon,
  HockeyIcon,
  EsportsIcon,
  HandballIcon,
  VolleyballIcon,
  RugbyIcon
} from '@/components/icons/SportIcons';
import { useDeviceInfo } from '@/hooks/use-mobile';

type SportItem = {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
};

const SportsCategoryTabs = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);
  const { isMobile } = useDeviceInfo();

  const handleSportSelect = (sport: string) => {
    dispatch(uiActions.setSelectedSport(sport));
    navigate(`/${sport.toLowerCase()}`);
  };

  const sportsList: SportItem[] = [
    { id: 'tv', icon: TvIcon, label: 'TV' },
    { id: 'football', icon: FootballIcon, label: 'Football' },
    { id: 'basketball', icon: BasketballIcon, label: 'Basketball' },
    { id: 'horseracing', icon: HorseRacingIcon, label: 'Horse Racing' },
    { id: 'snooker', icon: SnookerIcon, label: 'Snooker' },
    { id: 'esports', icon: EsportsIcon, label: 'Esports' }
  ];

  return (
    <Card className={cn(
      "rounded-none border-b shadow-lg fixed left-0 z-50 w-full backdrop-blur-sm",
      "bg-white/95 dark:bg-gray-900/95 dark:border-gray-800",
      isMobile ? "top-16" : "top-[87px]"
    )}>
      <div className={cn(
        "flex items-center p-1",
        isMobile 
          ? "px-2 justify-start overflow-x-auto scrollbar-hide" 
          : "px-4 ml-[140px] mr-[150px]"
      )}>
        {isMobile ? (
          // Mobile: Horizontal scrolling tabs
          <div className="flex items-center gap-1 pb-1">
            {sportsList.map(({ id, icon: Icon, label }) => (
              <div
                key={id}
                onClick={() => handleSportSelect(id)}
                className={cn(
                  'flex items-center justify-center gap-1 px-2 py-2 cursor-pointer transition-all duration-200 ease-in-out min-w-fit flex-shrink-0',
                  selectedSport === id
                    ? 'text-[#15222A] bg-gray-100 rounded-md dark:text-white dark:bg-gray-700'
                    : 'text-[#6B7173] hover:text-[#15222A] dark:text-gray-300 dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-normal whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          // Desktop: Original fixed layout
          <>
            {/* Fixed TV tab on the left */}
            <div
              onClick={() => handleSportSelect('tv')}
              className={cn(
                'flex items-center justify-start gap-2 px-3 py-2 cursor-pointer transition-all duration-200 ease-in-out min-w-fit fixed left-[140px]',
                selectedSport === 'tv'
                  ? 'text-[#15222A] dark:text-white'
                  : 'text-[#6B7173] hover:text-[#15222A] dark:text-gray-300 dark:hover:text-white'
              )}
            >
              <TvIcon className="h-[1.1rem] w-[1.1rem]" />
              <span className="text-[0.94rem] font-normal whitespace-nowrap">TV</span>
            </div>

            {/* Other tabs with consistent spacing based on TV-Football gap */}
            <div className="flex items-center ml-[30px]" style={{ gap: '5px' }}>
              {sportsList.slice(1).map(({ id, icon: Icon, label }, index) => (
                <div
                  key={id}
                  onClick={() => handleSportSelect(id)}
                  className={cn(
                    'flex items-center justify-start gap-2 px-3 py-2 cursor-pointer transition-all duration-200 ease-in-out min-w-fit',
                    selectedSport === id
                      ? 'text-[#15222A] dark:text-white'
                      : 'text-[#6B7173] hover:text-[#15222A] dark:text-gray-300 dark:hover:text-white',
                    index === 0 ? 'ml-5' : '' // Add 20px margin to Football (first item)
                  )}
                >
                  <Icon className="h-[1.1rem] w-[1.1rem]" />
                  <span className="text-[0.94rem] font-normal whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;