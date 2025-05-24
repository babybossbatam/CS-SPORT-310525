import React, { useState } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

import { useQuery } from '@tanstack/react-query';

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  // Keep focus on match fixtures only

  return (
    <Card className="bg-white shadow-md w-full space-y-4">
              <div className="flex items-center justify-between h-9 p-4">
                <button className="p-2 hover:bg-gray-100 rounded-r-full flex items-center -ml-4">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="relative h-full flex items-center">
                  <Select>
                    <SelectTrigger className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md h-full border-0 bg-transparent">
                      <SelectValue>
                        <span className="font-medium">{selectedFilter}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start" className="w-[280px] p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(selectedDate)}
                        onSelect={(date) => {
                          if (date) {
                            dispatch(uiActions.setSelectedDate(format(date, 'yyyy-MM-dd')));
                          }
                        }}
                        className="rounded-md"
                        selected={new Date()}
                        onSelect={(date) => {
                          if (date) {
                            const today = new Date();
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            if (date.toDateString() === today.toDateString()) {
                              setSelectedFilter("Today's Matches");
                            } else if (date.toDateString() === yesterday.toDateString()) {
                              setSelectedFilter("Yesterday's Matches");
                            } else if (date.toDateString() === tomorrow.toDateString()) {
                              setSelectedFilter("Tomorrow's Matches");
                            } else {
                              setSelectedFilter(date.toDateString());
                            }

                            // Close the dropdown
                            const select = document.querySelector('[data-state="open"]')?.parentElement;
                            if (select) {
                              const event = new Event('mousedown', { bubbles: true });
                              select.dispatchEvent(event);
                            }
                          }
                        }}
                        className="rounded-md"
                      />
                    </SelectContent>
                  </Select>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-l-full flex items-center -mr-4">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <button className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-800 text-white rounded-full text-xs font-medium w-fit">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Live
                </button>
                <button className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-gray-100 rounded-full text-xs font-medium w-fit">
                  <Clock className="h-3.5 w-3.5" />
                  By time
                </button>
              </div>
      </Card>
  );
};

export default MatchFixturesCard;