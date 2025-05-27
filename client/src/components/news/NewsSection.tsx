
import React, { useEffect } from 'react';
import { Newspaper, ArrowRight, Clock, ExternalLink } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, newsActions } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistance } from 'date-fns';

// Define NewsItem interface that matches the server structure
export interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  source: string;
  url: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NewsSectionProps {
  maxItems?: number;
  sport?: string;
  showHeader?: boolean;
  variant?: 'card' | 'list' | '365scores';
  className?: string;
}

// Individual news item component for 365scores style
const NewsItem365: React.FC<{ news: NewsItem }> = ({ news }) => {
  const [imageError, setImageError] = React.useState(false);
  
  const fallbackImage = 'https://images.pexels.com/photos/47343/the-ball-stadion-football-the-pitch-47343.jpeg';
  
  const handleClick = () => {
    if (news.url) {
      let safeUrl = news.url;
      if (!safeUrl.startsWith('http')) {
        safeUrl = `https://${safeUrl}`;
      }
      if (safeUrl.startsWith('/')) {
        safeUrl = `${window.location.origin}${safeUrl}`;
      }
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  const getTimeAgo = () => {
    try {
      const publishedDate = new Date(news.publishedAt);
      const now = new Date();
      return formatDistance(publishedDate, now, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };
  
  return (
    <div 
      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 w-16 h-12 overflow-hidden rounded">
        <img 
          src={imageError ? fallbackImage : (news.imageUrl || fallbackImage)} 
          alt={news.title} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium line-clamp-2 mb-1 text-gray-900">{news.title}</h4>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {getTimeAgo()}
          </span>
          <span className="text-gray-400">{news.source}</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" />
    </div>
  );
};

// Individual news card component
const NewsCard: React.FC<{ news: NewsItem }> = ({ news }) => {
  const [imageError, setImageError] = React.useState(false);
  
  const fallbackImage = 'https://images.pexels.com/photos/47343/the-ball-stadion-football-the-pitch-47343.jpeg';
  
  const handleClick = () => {
    if (news.url) {
      let safeUrl = news.url;
      if (!safeUrl.startsWith('http')) {
        safeUrl = `https://${safeUrl}`;
      }
      if (safeUrl.startsWith('/')) {
        safeUrl = `${window.location.origin}${safeUrl}`;
      }
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  const getTimeAgo = () => {
    try {
      const publishedDate = new Date(news.publishedAt);
      const now = new Date();
      return formatDistance(publishedDate, now, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };
  
  return (
    <Card 
      className="w-full overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] border-0 shadow-none"
      onClick={handleClick}
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img 
          src={imageError ? fallbackImage : (news.imageUrl || fallbackImage)} 
          alt={news.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
        />
      </div>
      <CardContent className="p-3 px-0">
        <h3 className="text-sm font-medium line-clamp-2 mb-2 h-10">{news.title}</h3>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{news.source}</span>
          <span>{getTimeAgo()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const NewsSection: React.FC<NewsSectionProps> = ({ 
  maxItems = 3, 
  sport, 
  showHeader = true, 
  variant = 'card',
  className = '' 
}) => {
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
      <div className={`flex justify-center items-center py-10 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error || isError) {
    return (
      <div className={`flex justify-center items-center py-10 text-red-500 ${className}`}>
        <p>Failed to load news articles</p>
      </div>
    );
  }

  // If no news items, show empty state
  if (!newsItems || newsItems.length === 0) {
    return (
      <div className={`flex justify-center items-center py-10 text-gray-500 ${className}`}>
        <p>No news articles available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Newspaper className="mr-2 h-5 w-5" />
            {variant === '365scores' ? 'Live Football News' : 'Latest News'}
          </h2>
          {variant !== '365scores' && (
            <Link href="/news" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
              View All News <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          )}
        </div>
      )}
      
      {variant === '365scores' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {newsItems.slice(0, maxItems).map((news: NewsItem) => (
              <NewsItem365 key={news.id} news={news} />
            ))}
          </div>
        </div>
      ) : variant === 'list' ? (
        <div className="space-y-2">
          {newsItems.slice(0, maxItems).map((news: NewsItem) => (
            <NewsItem365 key={news.id} news={news} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {newsItems.slice(0, maxItems).map((news: NewsItem) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsSection;
