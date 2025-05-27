import React, { useEffect } from 'react';
import NewsCard, { NewsItem } from './NewsCard';
import { Newspaper, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, newsActions } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';

interface NewsSectionProps {
  maxItems?: number;
  sport?: string; // Optional sport prop to override selectedSport from Redux
}

const NewsSection: React.FC<NewsSectionProps> = ({ maxItems = 3, sport }) => {
  const dispatch = useDispatch();
  const { items: newsItems, loading, error } = useSelector((state: RootState) => state.news);
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);

  // Use the sport prop if provided, otherwise use the selectedSport from Redux
  const sportType = sport || selectedSport;

  // Fetch news articles from API with the selected sport as a parameter
  const { data: newsData, isLoading, isError } = useQuery<NewsItem[]>({
    queryKey: ['/api/news', sportType],
    queryFn: async () => {
      // Only pass sport if it's not 'tv' (which is not a real sport category)
      const sportParam = sportType !== 'tv' ? `&sport=${sportType}` : '';
      const response = await fetch(`/api/news?category=sports${sportParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json();
    },
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Newspaper className="mr-2 h-5 w-5" />
          Latest News
        </h2>
        <Link href="/news" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
          View All News <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {newsItems.slice(0, maxItems).map((news: NewsItem) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
import React from 'react';
import { format } from 'date-fns';

interface Props {
  news: any[];
}

const SimpleNewsList: React.FC<Props> = ({ news }) => {
  return (
    <div className="space-y-3">
      {news && news.map((item) => (
        <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
          <h4 className="font-medium text-sm mb-1 line-clamp-2">{item.title || 'No title available'}</h4>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.content || 'No content available'}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{item.source || 'Unknown source'}</span>
            <span>{item.publishedAt ? format(new Date(item.publishedAt), 'MMM d, HH:mm') : 'Unknown time'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimpleNewsList;