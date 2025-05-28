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
    { id: 'horseracing', icon: HorseRacingIcon, label: 'Horse Racing' },
    { id: 'snooker', icon: SnookerIcon, label: 'Snooker' },
    { id: 'esports', icon: EsportsIcon, label: 'Esports' }
  ];

  return (
    <Card className="rounded-none border-b shadow-lg fixed left-0 z-50 top-[77px] w-full bg-white/95 backdrop-blur-sm">
        <div className="flex items-center p-1 px-4 ml-[140px] mr-[150px]">
          {/* Fixed TV tab on the left */}
          <div
            onClick={() => handleSportSelect('tv')}
            className={cn(
              'flex items-center justify-start gap-2 px-3 py-2 cursor-pointer transition-all duration-200 ease-in-out min-w-fit fixed left-[140px]',
              selectedSport === 'tv'
                ? 'text-[#15222A]'
                : 'text-[#6B7173] hover:text-[#15222A]'
            )}
          >
            <TvIcon className="h-[1.1rem] w-[1.1rem]" />
            <span className="text-[0.94rem] font-normal whitespace-nowrap">TV</span>
          </div>

          {/* Other tabs with consistent spacing based on TV-Football gap */}
          <div className="flex items-center ml-[30px]" style={{ gap: '30px' }}>
            {sportsList.slice(1).map(({ id, icon: Icon, label }, index) => (
              <div
                key={id}
                onClick={() => handleSportSelect(id)}
                className={cn(
                  'flex items-center justify-start gap-2 px-3 py-2 cursor-pointer transition-all duration-200 ease-in-out min-w-fit',
                  selectedSport === id
                    ? 'text-[#15222A]'
                    : 'text-[#6B7173] hover:text-[#15222A]',
                  index === 0 ? 'ml-5' : '' // Add 20px margin to Football (first item)
                )}
              >
                <Icon className="h-[1.1rem] w-[1.1rem]" />
                <span className="text-[0.94rem] font-normal whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>

          
        </div>
    </Card>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;