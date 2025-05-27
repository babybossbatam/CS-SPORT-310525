import { useEffect, useState } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, fixturesActions } from '@/lib/store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const DateNavigator = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [league, setLeague] = useState<{ name: string; logo: string } | null>(null);

  // Always ensure today's date is set as default on component mount
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    // Set to today's date when component mounts
    dispatch(uiActions.setSelectedDate(today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format the selected date for display
  const formattedDate = format(parseISO(selectedDate), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = formattedDate === today;

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    dispatch(uiActions.setSelectedDate(newDate));
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    dispatch(uiActions.setSelectedDate(newDate));
  };

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = format(date, 'yyyy-MM-dd');
      dispatch(uiActions.setSelectedDate(newDate));
      setIsCalendarOpen(false);
    }
  };

  // Get display text for date
  const getDateDisplayText = () => {
    if (isToday) {
      return "Today's Matches";
    }

    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    if (formattedDate === yesterday) {
      return "Yesterday's Matches";
    }

    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    if (formattedDate === tomorrow) {
      return "Tomorrow's Matches";
    }

    return format(parseISO(selectedDate), 'MMMM d, yyyy');
  };

  // Handle today button click
  const goToToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    dispatch(uiActions.setSelectedDate(today));
  };

  // Fetch fixtures for the selected date
  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        dispatch(fixturesActions.setLoadingFixtures(true));

        const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}`);
        const data = await response.json();

        dispatch(fixturesActions.setFixturesByDate({ 
          date: selectedDate,
          fixtures: data 
        }));
      } catch (error) {
        console.error('Error fetching fixtures:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matches for this date',
          variant: 'destructive',
        });
        dispatch(fixturesActions.setFixturesError('Failed to load matches'));
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };

    fetchFixtures();
  }, [selectedDate, dispatch, toast]);

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 text-neutral-500"
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className={`px-3 py-1 text-sm font-medium ${
                isToday 
                  ? "text-gray-400 cursor-not-allowed opacity-60" 
                  : "text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
              onClick={goToToday}
              disabled={isToday}
            >
              Today
            </Button>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`relative flex items-center space-x-2 ${
                    !isToday 
                      ? "bg-blue-500 text-white hover:bg-blue-600" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {getDateDisplayText()}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  mode="single"
                  selected={parseISO(selectedDate)}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 text-neutral-500"
            onClick={goToNextDay}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateNavigator;