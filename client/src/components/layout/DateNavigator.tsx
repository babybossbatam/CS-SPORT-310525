
import { useEffect, useState } from 'react';
import { format, addDays, subDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, fixturesActions } from '@/lib/store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import './DateNavigator.css';

const DateNavigator = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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
  const handleDateSelect = (date: string) => {
    dispatch(uiActions.setSelectedDate(date));
    setIsCalendarOpen(false);
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

  // Calendar navigation
  const prevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get days for calendar display
  const getDaysInMonth = () => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add empty cells for days before the month starts
    const startDay = getDay(start);
    const emptyDays = Array(startDay).fill(null);
    
    return [...emptyDays, ...days];
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

  const daysInMonth = getDaysInMonth();

  return (
    <>
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

              <div className="relative">
                <Button 
                  variant="ghost" 
                  className={`relative flex items-center space-x-2 ${
                    !isToday 
                      ? "bg-blue-500 text-white hover:bg-blue-600" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {getDateDisplayText()}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </Button>

                {isCalendarOpen && (
                  <div className="calendar-popup">
                    <div className="calendar-header">
                      <button 
                        onClick={prevMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="font-semibold text-gray-800">
                        {format(calendarMonth, 'MMMM yyyy')}
                      </div>
                      <button 
                        onClick={nextMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="calendar-weekdays">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                      ))}
                    </div>

                    <div className="calendar-days">
                      {daysInMonth.map((day, index) => {
                        if (!day) {
                          return <div key={index} />;
                        }

                        const dayString = format(day, 'yyyy-MM-dd');
                        const isDayToday = dayString === today;
                        const isSelected = dayString === selectedDate;
                        
                        return (
                          <button
                            key={dayString}
                            className={`calendar-day ${isDayToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleDateSelect(dayString)}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      })}
                    </div>

                    <div 
                      className={`today-indicator ${isToday ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!isToday) {
                          goToToday();
                          setIsCalendarOpen(false);
                        }
                      }}
                    >
                      Today
                    </div>
                  </div>
                )}
              </div>
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

      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsCalendarOpen(false)}
        />
      )}
    </>
  );
};

export default DateNavigator;
