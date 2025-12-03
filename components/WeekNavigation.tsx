"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { useState } from "react";

interface WeekNavigationProps {
  currentWeekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onJumpToDate?: (date: Date) => void;
}

export function WeekNavigation({
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onJumpToDate,
}: WeekNavigationProps) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (onJumpToDate) {
      onJumpToDate(selectedDate);
    }
    setShowDatePicker(false);
  };
  
  return (
    <div className="flex items-center justify-between p-4 md:p-5 border-b bg-card shadow-subtle">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Weekly Calendar</h1>
          <span className="hidden md:inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
            {format(currentWeekStart, "MMMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-muted-foreground font-medium">
            Week of {format(currentWeekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </span>
          {onJumpToDate && (
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-xs text-primary hover:text-primary/80 underline ml-1 transition-colors"
              aria-label="Jump to date"
            >
              {showDatePicker ? 'Close' : 'Jump to date'}
            </button>
          )}
        </div>
        {showDatePicker && onJumpToDate && (
          <div className="mt-2 animate-in">
            <input
              type="date"
              onChange={handleDateChange}
              defaultValue={format(currentWeekStart, "yyyy-MM-dd")}
              className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              autoFocus
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="hidden md:flex h-9"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Today
        </Button>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPreviousWeek}
            className="h-8 px-2 md:px-3 hover:bg-background"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Prev</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNextWeek}
            className="h-8 px-2 md:px-3 hover:bg-background"
            aria-label="Next week"
          >
            <span className="hidden md:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="md:hidden h-8 w-8 p-0"
          aria-label="Go to today"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
