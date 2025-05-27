import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, newsActions, uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import NewsCard from '@/components/news/NewsCard';
import { Loader2, Newspaper, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Import the NewsItem type from our NewsCard component
import { NewsItem } from '@/components/news/NewsCard';

// Use the same type for our API response for simplicity
type NewsApiResponse = NewsItem;

const NewsPage = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [location] = useLocation();
  const [category, setCategory] = useState<string>('sports');
  const [sport, setSport] = useState<string>('football');
  const { items: newsItems, loading, error } = useSelector((state: RootState) => state.news);
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);
  
  // Handle URL parameters
  useEffect(() => {
    const pathSegments = location.split('/');
    if (pathSegments.length > 2) {
      // If there's a parameter like /news/1, just use the base news page
      console.log('NewsPage accessed with parameter:', pathSegments[2]);
    }
  }, [location]);
  
  // Update the sport based on the selected sport in UI
  useEffect(() => {
    if (selectedSport) {
      setSport(selectedSport);
    }
  }, [selectedSport]);
  
  // Fetch news articles from API with the selected category and sport
  const { data: newsData, isLoading, isError, error: queryError } = useQuery<NewsApiResponse[]>({
    queryKey: ['/api/news', category, sport],
    queryFn: async () => {
      console.log('Fetching news with:', { category, sport });
      const response = await fetch(`/api/news?category=${category}&sport=${sport}`);
      if (!response.ok) {
        console.error('News API error:', response.status, response.statusText);
        throw new Error(`Failed to fetch news: ${response.status}`);
      }
      const data = await response.json();
      console.log('News data received:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
  
  // Update Redux store when data is fetched
  useEffect(() => {
    if (isLoading) {
      dispatch(newsActions.setLoadingNews(true));
    } else if (isError) {
      dispatch(newsActions.setNewsError('Failed to fetch news articles'));
      toast({
        title: 'Error loading news',
        description: 'Could not load the latest news. Please try again later.',
        variant: 'destructive',
      });
    } else if (newsData) {
      dispatch(newsActions.setNewsItems(newsData));
      dispatch(newsActions.setLoadingNews(false));
    }
  }, [newsData, isLoading, isError, dispatch, toast]);
  
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
  };
  
  // Handle sport selection from SportsCategoryTabs
  const handleSportChange = (sportId: string) => {
    setSport(sportId);
    // Update the global UI state as well
    dispatch(uiActions.setSelectedSport(sportId));
  };
  
  // Show loading state
  if (loading || isLoading) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Sports News
          </h1>
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </main>
      </>
    );
  }
  
  // Show error state
  if (error || isError) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Sports News
          </h1>
          <Card className="p-6 text-center">
            <div className="text-red-500 mb-4">Failed to load news articles</div>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </Card>
        </main>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <SportsCategoryTabs 
        onSportClick={(sportId) => handleSportChange(sportId)} 
      />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            {sport.charAt(0).toUpperCase() + sport.slice(1)} News
          </h1>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Category:</span>
          </div>
        </div>
        
        <Tabs defaultValue="sports" className="mb-8">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-5">
            <TabsTrigger 
              value="sports" 
              onClick={() => handleCategoryChange('sports')}
            >
              Sports
            </TabsTrigger>
            <TabsTrigger 
              value="world" 
              onClick={() => handleCategoryChange('world')}
            >
              World
            </TabsTrigger>
            <TabsTrigger 
              value="business" 
              onClick={() => handleCategoryChange('business')}
            >
              Business
            </TabsTrigger>
            <TabsTrigger 
              value="entertainment" 
              onClick={() => handleCategoryChange('entertainment')}
            >
              Entertainment
            </TabsTrigger>
            <TabsTrigger 
              value="technology" 
              onClick={() => handleCategoryChange('technology')}
            >
              Technology
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator className="my-6" />
        
        {/* If no news items, show empty state */}
        {(!newsItems || newsItems.length === 0) ? (
          <div className="flex justify-center items-center py-10 text-gray-500">
            <p>No news articles available for {sport.charAt(0).toUpperCase() + sport.slice(1)} in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default NewsPage;