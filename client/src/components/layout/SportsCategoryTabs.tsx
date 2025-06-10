import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState, uiActions } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const SportsCategoryTabs = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);

  const handleSportSelect = (sport: string) => {
    dispatch(uiActions.setSelectedSport(sport));
    navigate(`/${sport.toLowerCase()}`);
  };

  return (
    <Card className="rounded-none border-b shadow-lg fixed left-0 z-50 top-[77px] w-full bg-white/95 backdrop-blur-sm">
      <div className="flex items-center p-1 px-4 ml-[140px] mr-[150px]">
        {/* Card content removed - keeping empty card structure */}
      </div>
    </Card>
  );
};

export { SportsCategoryTabs };
export default SportsCategoryTabs;