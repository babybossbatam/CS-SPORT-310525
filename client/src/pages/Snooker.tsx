import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import Footer from '@/components/layout/Footer';
import ComingSoon from '@/components/common/ComingSoon';
import { SnookerIcon } from '@/components/icons/SportIcons';

const Snooker = () => {
  const dispatch = useDispatch();

  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('snooker'));
  }, [dispatch]);

  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <ComingSoon 
        title="Snooker Scores Coming Soon"
        description="We're working on adding snooker scores and statistics. Check back soon for updates on World Championships, Masters, and other major tournaments!"
        icon={SnookerIcon}
        feature="snooker"
      />
      
      <Footer />
    </>
  );
};

export default Snooker;