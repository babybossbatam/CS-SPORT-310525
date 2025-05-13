import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, newsActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import NewsCard from '@/components/news/NewsCard';
import { Loader2, Newspaper, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Import the NewsItem type from our NewsCard component
import { NewsItem } from '@/components/news/NewsCard';

// Use the same type for our API response for simplicity
type NewsApiResponse = NewsItem;

const NewsPage = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('sports');
  const { items: newsItems, loading, error } = useSelector((state: RootState) => state.news);
  
  // Fetch news articles from API with the selected category
  const { data: newsData, isLoading, isError } = useQuery<NewsApiResponse[]>({
    queryKey: ['/api/news', category],
    queryFn: async () => {
      const response = await fetch(`/api/news?category=${category}&source=gnews`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      <SportsCategoryTabs />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Sports News
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
            <p>No news articles available in this category</p>
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