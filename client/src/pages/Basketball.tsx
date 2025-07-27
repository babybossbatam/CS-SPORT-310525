import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyBasketballMain from '@/components/layout/MyBasketballMain';
import NewsSection from '@/components/news/NewsSection';
import { Dribbble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Basketball = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('basketball'));
    
    // Test basketball API connectivity
    const testApiConnection = async () => {
      try {
        const response = await fetch('/api/basketball/test');
        if (response.ok) {
          const data = await response.json();
          console.log('🏀 Basketball API test successful:', data);
          setApiStatus('connected');
        } else {
          throw new Error(`API test failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('🏀 Basketball API test failed:', error);
        setApiStatus('error');
        toast({
          title: "Basketball API Error",
          description: "Unable to connect to basketball data service",
          variant: "destructive",
        });
      }
    };
    
    testApiConnection();
  }, [dispatch, toast]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Basketball - Top Leagues" 
        icon={<Dribbble className="h-4 w-4 text-neutral-600" />} 
      />
      
      <div className="flex-1" style={{ marginTop: "52px" }}>
        {apiStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
            <p className="text-red-800 text-sm">
              Basketball API connection failed. Please check server logs.
            </p>
          </div>
        )}
        {apiStatus === 'loading' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 m-4">
            <p className="text-blue-800 text-sm">
              Testing basketball API connection...
            </p>
          </div>
        )}
        <MyBasketballMain fixtures={[]} />
      </div>
    </>
  );
};

export default Basketball;