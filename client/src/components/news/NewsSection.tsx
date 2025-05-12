import React, { useEffect } from 'react';
import NewsCard, { NewsItem } from './NewsCard';
import { Newspaper } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, newsActions } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const NewsSection: React.FC = () => {
  const dispatch = useDispatch();
  const { items: newsItems, loading, error } = useSelector((state: RootState) => state.news);
  
  // Fetch news articles from API
  const { data: newsData, isLoading, isError } = useQuery({
    queryKey: ['/api/news'],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Update Redux store when data is fetched
  useEffect(() => {
    if (isLoading) {
      dispatch(newsActions.setLoadingNews(true));
    } else if (isError) {
      dispatch(newsActions.setNewsError('Failed to fetch news articles'));
    } else if (newsData) {
      dispatch(newsActions.setNewsItems(newsData));
      dispatch(newsActions.setLoadingNews(false));
    }
  }, [newsData, isLoading, isError, dispatch]);
  
  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show error state
  if (error || isError) {
    return (
      <div className="flex justify-center items-center py-10 text-red-500">
        <p>Failed to load news articles</p>
      </div>
    );
  }
  
  // If no news items, show empty state
  if (!newsItems || newsItems.length === 0) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-500">
        <p>No news articles available</p>
      </div>
    );
  }
  
  return (
    <div>      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {newsItems.map((news: NewsItem) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>
    </div>
  );
};

export default NewsSection;