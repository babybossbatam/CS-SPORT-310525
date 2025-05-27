
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid } from 'date-fns';

interface NewsArticle {
  id: number;
  title: string;
  content?: string;
  summary?: string;
  publishedAt: string;
  source: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  league?: {
    id: number;
    name: string;
    logo: string;
  };
  teams?: Array<{
    id: number;
    name: string;
    logo: string;
  }>;
}

interface NewsSectionProps {
  title?: string;
  maxItems?: number;
  showImages?: boolean;
  compact?: boolean;
}

const NewsSection: React.FC<NewsSectionProps> = ({ 
  title = "Live Football News",
  maxItems = 10,
  showImages = true,
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch news data
  const { data: newsArticles = [], isLoading, error } = useQuery({
    queryKey: ['football-news'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/news');
        const data = await response.json();
        
        // Transform API response to consistent format
        return data.map((article: any, index: number) => ({
          id: article.id || index + 1,
          title: article.title || 'No Title Available',
          content: article.content || article.summary || '',
          summary: article.summary || article.content?.substring(0, 150) + '...' || '',
          publishedAt: article.publishedAt || article.published_at || new Date().toISOString(),
          source: article.source || 'SportMonks',
          url: article.url || article.link || '#',
          imageUrl: article.imageUrl || article.image || null,
          category: article.category || article.type || 'general',
          league: article.league ? {
            id: article.league.id,
            name: article.league.name,
            logo: article.league.logo
          } : null,
          teams: article.teams || []
        }));
      } catch (error) {
        console.error('Error fetching news:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = ['all', ...new Set(newsArticles.map(article => article.category).filter(Boolean))];
    return cats;
  }, [newsArticles]);

  // Filter articles by category
  const filteredArticles = React.useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? newsArticles 
      : newsArticles.filter(article => article.category === selectedCategory);
    
    return filtered.slice(0, maxItems);
  }, [newsArticles, selectedCategory, maxItems]);

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Just now';
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
      
      return format(date, 'MMM d');
    } catch {
      return 'Just now';
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'all': 'All News',
      'general': 'General',
      'postmatch': 'Post Match',
      'prematch': 'Pre Match',
      'transfer': 'Transfers',
      'injury': 'Injuries',
      'lineup': 'Lineups'
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0 p-4">
                <div className="flex gap-3">
                  {showImages && (
                    <Skeleton className="w-20 h-16 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !newsArticles.length) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No news available at the moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            {title}
          </h3>
          <span className="text-sm text-gray-500">{filteredArticles.length} articles</span>
        </div>
        
        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-0">
          {filteredArticles.map((article, index) => (
            <div 
              key={article.id} 
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                if (article.url && article.url !== '#') {
                  window.open(article.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              <div className={`${compact ? 'p-3' : 'p-4'}`}>
                <div className="flex gap-3">
                  {/* Article Image */}
                  {showImages && article.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-20 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* League/Team logos for context */}
                  {!showImages && (article.league || article.teams?.length) && (
                    <div className="flex-shrink-0 flex items-center">
                      {article.league && (
                        <img
                          src={article.league.logo}
                          alt={article.league.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {article.teams?.slice(0, 2).map((team) => (
                        <img
                          key={team.id}
                          src={team.logo}
                          alt={team.name}
                          className="w-6 h-6 object-contain -ml-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Article Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-gray-900 line-clamp-2 ${compact ? 'text-sm' : 'text-base'} mb-1`}>
                      {article.title}
                    </h4>
                    
                    {article.summary && !compact && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {article.summary}
                      </p>
                    )}
                    
                    {/* Article Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(article.publishedAt)}</span>
                      </div>
                      
                      <span>•</span>
                      <span>{article.source}</span>
                      
                      {article.category && article.category !== 'general' && (
                        <>
                          <span>•</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                            {getCategoryDisplayName(article.category)}
                          </span>
                        </>
                      )}
                      
                      {article.league && (
                        <>
                          <span>•</span>
                          <span>{article.league.name}</span>
                        </>
                      )}
                      
                      {article.url && article.url !== '#' && (
                        <>
                          <span>•</span>
                          <ExternalLink className="h-3 w-3" />
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* View More Button */}
        {newsArticles.length > maxItems && (
          <div className="p-4 border-t">
            <button
              onClick={() => {
                // Navigate to full news page or expand
                console.log('View more news');
              }}
              className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-2"
            >
              View All News ({newsArticles.length} total)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsSection;
