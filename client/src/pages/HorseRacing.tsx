import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import ComingSoon from '@/components/common/ComingSoon';
import { HorseRacingIcon } from '@/components/icons/SportIcons';

const HorseRacing = () => {
  const dispatch = useDispatch();

  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('horseracing'));
  }, [dispatch]);

  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <ComingSoon 
        title="Horse Racing Coming Soon"
        description="We're working on adding comprehensive horse racing results, statistics, and race schedules. Check back soon for updates on major races, tracks, and competitions worldwide!"
        icon={HorseRacingIcon}
        feature="horse racing"
      />
    </>
  );
};

export default HorseRacing;