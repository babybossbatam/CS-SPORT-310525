import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyBasketballMain from '@/components/layout/MyBasketballMain';
import Footer from '@/components/layout/Footer';
import NewsSection from '@/components/news/NewsSection';
import { Dribbble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Basketball = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('basketball'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Basketball - Top Leagues" 
        icon={<Dribbble className="h-4 w-4 text-neutral-600" />} 
      />
      
      <div className="flex-1" style={{ marginTop: "52px" }}>
        <MyBasketballMain fixtures={[]} />
      </div>
      
      <Footer />
    </>
  );
};

export default Basketball;