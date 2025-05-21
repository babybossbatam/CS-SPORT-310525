import React, { useEffect, useState } from 'react';

interface ScreenReaderAnnouncementProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  timeout?: number;
}

/**
 * Component for announcing messages to screen readers
 * Uses ARIA live regions to announce content changes
 */
const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  politeness = 'polite',
  timeout = 5000,
}) => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Add new announcement and clean up after timeout
  useEffect(() => {
    if (!message) return;
    
    // Add to announcement queue
    const id = Date.now().toString();
    setAnnouncements(prev => [...prev, message]);
    
    // Clean up after specified timeout
    const timer = setTimeout(() => {
      setAnnouncements(prev => prev.filter(item => item !== message));
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [message, timeout]);

  return (
    <div className="sr-only" aria-live={politeness} role={politeness === 'assertive' ? 'alert' : 'status'}>
      {announcements.map((announcement, index) => (
        <div key={`${index}-${announcement.substring(0, 10)}`}>
          {announcement}
        </div>
      ))}
    </div>
  );
};

export default ScreenReaderAnnouncement;