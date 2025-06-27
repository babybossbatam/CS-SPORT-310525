
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyLiveScoreWidgetProps {
  className?: string;
}

const MyLiveScoreWidget: React.FC<MyLiveScoreWidgetProps> = ({ className = "" }) => {
  useEffect(() => {
    // Load ScoreBat embed script if not already loaded
    const existingScript = document.getElementById('scorebat-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'scorebat-jssdk';
      script.src = 'https://www.scorebat.com/embed/embed.js?v=arrv';
      script.async = true;
      
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    }
  }, []);

  return (
    <Card className={`mt-4 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Live Football Scores</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full">
          <iframe 
            src="https://www.scorebat.com/embed/livescore/?token=MjExNjkxXzE3NTEwMjg1ODBfNGQyZjg1ZGE0Mjg5YjNmYTY2ZDEwOTM4MzQ0YjdhOTVlZjk3YTk5OA=="
            frameBorder="0"
            width="100%"
            height="760"
            allowFullScreen
            allow="autoplay; fullscreen"
            style={{
              width: '100%',
              height: '760px',
              overflow: 'hidden',
              display: 'block'
            }}
            className="_scorebatEmbeddedPlayer_"
            title="Live Football Scores"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveScoreWidget;
