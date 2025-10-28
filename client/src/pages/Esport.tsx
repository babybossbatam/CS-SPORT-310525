import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import Footer from '@/components/layout/Footer';
import ComingSoon from '@/components/common/ComingSoon';
import { EsportsIcon } from '@/components/icons/SportIcons';

const Esport = () => {
  const dispatch = useDispatch();

  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('esports'));
  }, [dispatch]);

  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <ComingSoon 
        title="Esports Scores Coming Soon"
        description="We're working on adding esports scores and statistics. Check back soon for updates on League of Legends, CS2, Dota 2, and other major gaming competitions!"
        icon={EsportsIcon}
        feature="esports"
      />
      
      {/* Footer with proper spacing to prevent content overlap */}
      <div className="mb-8">
        <Footer />
      </div>
    </>
  );
};

export default Esport;