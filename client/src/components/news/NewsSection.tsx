import React from 'react';
import NewsCard, { NewsItem } from './NewsCard';
import { Newspaper } from 'lucide-react';

// Current football news data sourced from 365scores.com
const sampleNewsData: NewsItem[] = [
  {
    id: '1',
    title: 'Real Madrid to arrive at Club World Cup with three signings for Xabi',
    imageUrl: 'https://images.pexels.com/photos/47343/the-ball-stadion-football-the-pitch-47343.jpeg',
    source: 'Football Espana',
    timeAgo: '11 Hours',
    url: 'https://www.365scores.com/news/real-madrid-to-arrive-at-club-world-cup-with-three-signings-for-xabi',
  },
  {
    id: '2',
    title: "Kylian Mbappe: The Unquestionable Leader of Real Madrid's Future",
    imageUrl: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg',
    source: 'Midseason Magazine',
    timeAgo: '13 Hours',
    url: 'https://www.365scores.com/news/kylian-mbappe-the-unquestionable-leader-of-real-madrids-future',
  },
  {
    id: '3',
    title: 'No More Castore - Umbro Replaces 25-26 Home Kit Leaked',
    imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
    source: 'Footy Headlines',
    timeAgo: '15 Hours',
    url: 'https://www.365scores.com/news/no-more-castore-umbro-replaces-25-26-home-kit-leaked',
  },
];

const NewsSection: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Live TV News</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sampleNewsData.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>
    </div>
  );
};

export default NewsSection;