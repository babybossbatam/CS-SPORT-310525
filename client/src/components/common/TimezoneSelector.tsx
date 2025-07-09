
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserTimezone, getTimezoneInfo } from '@/lib/timezoneUtils';

interface TimezoneSelectorProps {
  onTimezoneChange?: (timezone: string) => void;
  showCurrentTimezone?: boolean;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ 
  onTimezoneChange, 
  showCurrentTimezone = true 
}) => {
  const [currentTimezone, setCurrentTimezone] = useState<string>('');
  const [timezoneInfo, setTimezoneInfo] = useState<any>(null);

  useEffect(() => {
    const timezone = getUserTimezone();
    const info = getTimezoneInfo();
    setCurrentTimezone(timezone);
    setTimezoneInfo(info);
  }, []);

  const popularTimezones = [
    { value: 'UTC', label: 'UTC (GMT+0)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Manila', label: 'Manila (PHT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT/BRST)' },
  ];

  const handleTimezoneChange = (timezone: string) => {
    if (onTimezoneChange) {
      onTimezoneChange(timezone);
    }
  };

  if (!showCurrentTimezone) {
    return (
      <Select onValueChange={handleTimezoneChange} defaultValue={currentTimezone}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {popularTimezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <span>🌍</span>
      <span>{currentTimezone}</span>
      {timezoneInfo && (
        <span className="text-xs">
          (GMT{timezoneInfo.sign}{timezoneInfo.offsetHours.toString().padStart(2, '0')}:{timezoneInfo.offsetMinutes.toString().padStart(2, '0')})
        </span>
      )}
    </div>
  );
};

export default TimezoneSelector;
