
import { format, parseISO } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

interface MatchTimeData {
  startTime: string;
  endTime?: string;
  timezone: string;
  status: string;
  elapsed?: number;
}

export class TimezoneConverter {
  private static userTimezone: string = 'UTC';
  private static locationPermission: string = 'pending';

  static async initializeUserTimezone(): Promise<string> {
    try {
      // Get browser timezone as fallback
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.userTimezone = browserTimezone;

      // Try to get precise location-based timezone
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });

          const { latitude, longitude } = position.coords;
          
          // Use multiple fallback APIs for timezone detection
          const timezoneApis = [
            `https://api.bigdatacloud.net/data/timezone-by-coordinates?latitude=${latitude}&longitude=${longitude}&key=free`,
            `https://worldtimeapi.org/api/timezone/Europe/London`, // Fallback to check API availability
          ];

          for (const apiUrl of timezoneApis) {
            try {
              const response = await fetch(apiUrl);
              const data = await response.json();
              
              if (data.ianaTimeZone) {
                this.userTimezone = data.ianaTimeZone;
                this.locationPermission = 'granted';
                break;
              }
            } catch (error) {
              console.log('Timezone API failed, trying next...');
            }
          }
        } catch (error) {
          console.log('Geolocation failed, using browser timezone');
          this.locationPermission = 'denied';
        }
      }

      return this.userTimezone;
    } catch (error) {
      console.error('Error initializing timezone:', error);
      return 'UTC';
    }
  }

  static getUserTimezone(): string {
    return this.userTimezone;
  }

  static getLocationPermission(): string {
    return this.locationPermission;
  }

  static formatMatchTime(matchData: MatchTimeData, targetTimezone?: string): {
    startTime: string;
    endTime?: string;
    duration?: string;
    timezone: string;
  } {
    const timezone = targetTimezone || this.userTimezone;
    
    try {
      const startDate = parseISO(matchData.startTime);
      const startInUserTz = utcToZonedTime(startDate, timezone);
      
      let result = {
        startTime: format(startInUserTz, 'HH:mm'),
        timezone: this.getTimezoneAbbreviation(timezone)
      };

      // Calculate end time based on status
      if (matchData.status === 'NS') {
        return result;
      }

      if (['FT', 'AET', 'PEN'].includes(matchData.status)) {
        const duration = this.getMatchDuration(matchData.status);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const endInUserTz = utcToZonedTime(endDate, timezone);
        
        return {
          ...result,
          endTime: format(endInUserTz, 'HH:mm'),
          duration: `${duration}min`
        };
      }

      if (['LIVE', '1H', '2H', 'HT'].includes(matchData.status)) {
        const elapsed = matchData.elapsed || this.calculateElapsed(startDate);
        return {
          ...result,
          endTime: 'Live',
          duration: `${elapsed}'`
        };
      }

      return result;
    } catch (error) {
      console.error('Error formatting match time:', error);
      return {
        startTime: 'TBD',
        timezone: 'UTC'
      };
    }
  }

  private static getMatchDuration(status: string): number {
    switch (status) {
      case 'AET': return 120;
      case 'PEN': return 135;
      default: return 90;
    }
  }

  private static calculateElapsed(startDate: Date): number {
    const now = new Date();
    return Math.floor((now.getTime() - startDate.getTime()) / 60000);
  }

  static getTimezoneAbbreviation(timezone?: string): string {
    try {
      const tz = timezone || this.userTimezone;
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short',
        timeZone: tz
      });
      const parts = formatter.formatToParts(now);
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      return timeZonePart?.value || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }

  static convertToUserTimezone(utcDate: string, format: string = 'yyyy-MM-dd HH:mm'): string {
    try {
      const date = parseISO(utcDate);
      return formatInTimeZone(date, this.userTimezone, format);
    } catch (error) {
      return utcDate;
    }
  }

  static isMatchStale(startTime: string, status: string, maxHours: number = 3): boolean {
    try {
      if (!['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status)) {
        return false;
      }

      const start = parseISO(startTime);
      const now = new Date();
      const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceStart > maxHours;
    } catch (error) {
      return false;
    }
  }
}

export default TimezoneConverter;
