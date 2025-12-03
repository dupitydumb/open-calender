"use client";

import { useDraggable, useDroppable, useDndMonitor } from "@dnd-kit/core";
import { CalendarEvent, DAYS, slotToTime, formatTimeSlot, PIXELS_PER_SLOT } from "@/types/event";
import { GripVertical, ExternalLink } from "lucide-react";
import { format, addDays, isToday, isSameDay } from "date-fns";
import { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getContrastTextColor, cn } from "@/lib/utils";

interface CalendarGridProps {
  events: CalendarEvent[];
  currentWeekStart: Date;
  onEditEvent?: (event: CalendarEvent) => void;
  activeEvent?: CalendarEvent | null;
}

// Helper to format hour with AM/PM
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// Check if hour is within working hours (8 AM - 5 PM)
function isWorkingHour(hour: number): boolean {
  return hour >= 8 && hour < 17;
}

// Check if day is weekend
function isWeekend(day: string): boolean {
  return day === "Sat" || day === "Sun";
}

// Get current time position (for indicator line)
function getCurrentTimePosition(): { slot: number; show: boolean } {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  // Show on all days
  const show = true;
  const slot = hour * 4 + Math.floor(minutes / 15);
  
  return { slot, show };
}

interface CalendarGridProps {
  events: CalendarEvent[];
  currentWeekStart: Date;
  onEditEvent?: (event: CalendarEvent) => void;
  onCreateEvent?: (day: string, timeSlot: number) => void;
  activeEvent?: CalendarEvent | null;
}

export function CalendarGrid({ events, currentWeekStart, onEditEvent, onCreateEvent, activeEvent }: CalendarGridProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimePosition());
  const [dropTarget, setDropTarget] = useState<{ day: string; timeSlot: number } | null>(null);
  
  // Monitor drag events to track the current drop target
  useDndMonitor({
    onDragOver(event) {
      if (event.over?.data.current) {
        const { day, timeSlot } = event.over.data.current as { day: string; timeSlot: number };
        setDropTarget({ day, timeSlot });
      }
    },
    onDragEnd() {
      setDropTarget(null);
    },
    onDragCancel() {
      setDropTarget(null);
    },
  });
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimePosition());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to current time when component mounts or week changes
  useEffect(() => {
    const currentHour = new Date().getHours();
    // Only auto-scroll during working hours (7 AM - 7 PM)
    if (currentHour >= 7 && currentHour < 19) {
      const timeoutId = setTimeout(() => {
        const currentTimeElement = document.querySelector('.current-time-line');
        if (currentTimeElement) {
          currentTimeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentWeekStart]);
  
  // Filter events for the current week
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEvents = events.filter((e) => e.weekStart === weekStartStr);
  
  // Generate time slots starting from 8 AM to midnight (next day)
  const hours = Array.from({ length: 17 }, (_, i) => i + 8);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" role="region" aria-label="Calendar grid">
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block">
          <div className="min-w-[700px]" role="table" aria-label="Weekly schedule">
            {/* Header Row */}
            <div className="flex sticky top-0 bg-card z-10 border-b shadow-card" role="row">
              <div className="w-16 md:w-20 flex-shrink-0 border-r p-2 flex items-center justify-center text-xs md:text-sm font-semibold bg-card" role="columnheader">
                <span className="text-muted-foreground">Time</span>
              </div>
              {DAYS.map((day, index) => {
                const dayDate = addDays(currentWeekStart, index);
                const isCurrentDay = isToday(dayDate);
                return (
                  <div
                    key={day}
                    className={`flex-1 min-w-[120px] md:min-w-[140px] border-r p-3 text-center font-semibold text-sm md:text-base transition-colors ${
                      isCurrentDay 
                        ? 'bg-primary/10 border-primary/30 border-2' 
                        : isWeekend(day) 
                          ? 'bg-muted/30' 
                          : 'bg-card'
                    }`}
                    role="columnheader"
                    aria-label={`${day}, ${format(dayDate, 'MMM d')}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={isCurrentDay ? 'text-primary font-bold' : ''}>{day}</span>
                      <span className={`text-xs font-normal ${
                        isCurrentDay ? 'text-primary font-semibold' : 'text-muted-foreground'
                      }`}>
                        {format(dayDate, 'd')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slots - Each hour with 4 15-minute subdivisions */}
            {hours.map((hour) => {
              const isWorking = isWorkingHour(hour);
              const hourSlot = hour * 4; // Convert to slot number
              const showCurrentTime = currentTime.show && Math.floor(currentTime.slot / 4) === hour;
              const { hour: currentHour, minute: currentMinute } = slotToTime(currentTime.slot);
              const timeOffset = showCurrentTime ? (currentMinute / 60) * 80 : 0;
              
              return (
                <div 
                  key={hour} 
                  className={`flex border-b relative ${isWorking ? 'working-hours' : 'bg-muted/20'}`}
                  style={{ height: '80px' }}
                  role="row"
                  aria-label={`${formatHour(hour)} time slot`}
                >
                  {/* Time label with AM/PM */}
                  <div className="w-16 md:w-20 flex-shrink-0 border-r p-2 text-xs md:text-sm text-muted-foreground text-right bg-muted/30" role="rowheader">
                    <div className="font-medium">{formatHour(hour)}</div>
                  </div>
                  
                  {DAYS.map((day, dayIndex) => {
                    const dayDate = addDays(currentWeekStart, dayIndex);
                    const isCurrentDay = isToday(dayDate);
                    return (
                    <div key={`${day}-${hour}`} className={`flex-1 min-w-[120px] md:min-w-[140px] border-r relative ${
                      isCurrentDay ? 'bg-primary/5' : ''
                    }`}>
                      {/* Render 4 15-minute slots per hour */}
                      {[0, 1, 2, 3].map((quarterIndex) => {
                        const slot = hourSlot + quarterIndex;
                        return (
                          <CalendarCell
                            key={`${day}-${slot}`}
                            day={day}
                            timeSlot={slot}
                            events={weekEvents}
                            onEditEvent={onEditEvent}
                            onCreateEvent={onCreateEvent}
                            isWorkingHour={isWorking}
                            showDivider={quarterIndex < 3}
                            dropTarget={dropTarget}
                            eventDuration={activeEvent?.duration}
                          />
                        );
                      })}
                    </div>
                    );
                  })}
                  
                  {/* Current time indicator line */}
                  {showCurrentTime && (
                    <div 
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${timeOffset}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-16 md:w-20 flex items-center justify-end pr-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/50 current-time-line" />
                        </div>
                        <div className="flex-1 h-0.5 bg-primary shadow-sm current-time-line" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalendarCellProps {
  day: string;
  timeSlot: number;
  events: CalendarEvent[];
  onEditEvent?: (event: CalendarEvent) => void;
  onCreateEvent?: (day: string, timeSlot: number) => void;
  isWorkingHour?: boolean;
  showDivider?: boolean;
  dropTarget?: { day: string; timeSlot: number } | null;
  eventDuration?: number;
}

const CalendarCell = memo(function CalendarCell({ day, timeSlot, events, onEditEvent, onCreateEvent, isWorkingHour, showDivider, dropTarget, eventDuration }: CalendarCellProps) {
  const { setNodeRef } = useDroppable({
    id: `${day}-${timeSlot}`,
    data: { day, timeSlot },
  });

  // Check if this cell should be highlighted as part of the drop preview
  const isDropPreview = dropTarget && eventDuration && 
    dropTarget.day === day && 
    timeSlot >= dropTarget.timeSlot && 
    timeSlot < dropTarget.timeSlot + eventDuration;

  // Only render events that start at this time slot
  const cellEvents = events.filter(
    (e) => e.day === day && e.timeSlot === timeSlot
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only create event if clicking on empty area (not on an event)
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-cell-content]')) {
      onCreateEvent?.(day, timeSlot);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-0 transition-all cursor-pointer group",
        isDropPreview 
          ? "drop-zone-active ring-2 ring-primary ring-inset bg-primary/20" 
          : "hover:bg-accent/70 hover:ring-1 hover:ring-accent-foreground/20",
        showDivider && (timeSlot % 2 === 1) 
          ? "border-b border-dashed border-border/60" 
          : showDivider && (timeSlot % 2 === 0)
            ? "border-b border-solid border-border/40"
            : ""
      )}
      style={{
        height: '20px',
        top: `${(timeSlot % 4) * 20}px`,
      }}
      role="gridcell"
      aria-label={`${day} at ${formatTimeSlot(timeSlot)}, ${cellEvents.length} event${cellEvents.length !== 1 ? 's' : ''}. Double-click to create new event`}
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      data-cell-content
    >
      {cellEvents.map((event) => (
        <ScheduledEvent key={event.id} event={event} onEditEvent={onEditEvent} />
      ))}
    </div>
  );
});

interface ScheduledEventProps {
  event: CalendarEvent;
  onEditEvent?: (event: CalendarEvent) => void;
}

function ScheduledEvent({ event, onEditEvent }: ScheduledEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: event.id,
    data: { event },
  });

  const duration = event.duration || 1; // Duration in 15-minute slots
  const heightInPixels = duration * 20; // 20px per slot
  const textColor = getContrastTextColor(event.color);
  const textClass = textColor === "white" ? "text-white" : "text-black";

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: event.color,
    height: `${heightInPixels}px`,
    position: 'absolute' as const,
    top: 0,
    left: '4px',
    right: '4px',
    zIndex: isDragging ? 50 : 1,
  };

  const handleResizeTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // This will be handled by parent component through data attributes
  };

  const handleResizeBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // This will be handled by parent component through data attributes
  };
  
  // Format duration for display
  const formatDuration = (slots: number): string => {
    const hours = Math.floor(slots / 4);
    const minutes = (slots % 4) * 15;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md text-xs hover:shadow-xl transition-all group overflow-hidden ring-1 ring-black/10"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditEvent?.(event);
      }}
      aria-label={`${event.title}, ${formatDuration(duration)}. Double-click to edit`}
      {...attributes}
    >
      {/* Top resize handle - improved visibility */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-3 cursor-ns-resize transition-all flex items-center justify-center z-10",
          "opacity-0 group-hover:opacity-100",
          textColor === "white" ? "hover:bg-white/50 bg-white/30" : "hover:bg-black/30 bg-black/20"
        )}
        onMouseDown={handleResizeTop}
        data-resize="top"
        data-event-id={event.id}
      >
        <div className={cn(
          "w-8 h-0.5 rounded-full",
          textColor === "white" ? "bg-white/80" : "bg-black/60"
        )} />
      </div>
      
      {/* Event content */}
      <div className="p-2 h-full flex flex-col justify-between">
        <div className="flex items-start gap-1.5">
          <div
            className="cursor-move flex-shrink-0"
            {...listeners}
          >
            <GripVertical className={cn(
              "h-3.5 w-3.5 transition-opacity",
              "opacity-0 group-hover:opacity-80",
              textClass
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("font-semibold truncate leading-tight", textClass)}>{event.title}</div>
            {event.description && duration > 4 && (
              <div className={cn(
                "text-[10px] mt-1 line-clamp-2 leading-snug",
                textColor === "white" ? "text-white/90" : "text-black/80"
              )}>{event.description}</div>
            )}
            {duration >= 1 && (
              <div className={cn(
                "text-[10px] mt-1 font-medium",
                textColor === "white" ? "text-white/80" : "text-black/70"
              )}>
                {formatDuration(duration)}
              </div>
            )}
          </div>
        </div>
        
        {/* Meeting Link Button */}
        {event.link && duration >= 4 && (
          <div className="flex justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-[10px] font-medium transition-all pointer-events-auto touch-manipulation",
                "opacity-0 group-hover:opacity-100",
                textColor === "white" 
                  ? "bg-white/20 hover:bg-white/30 text-white" 
                  : "bg-black/15 hover:bg-black/25 text-black"
              )}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(event.link, '_blank', 'noopener,noreferrer');
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Open meeting link in new tab"
            >
              <ExternalLink className="h-2.5 w-2.5 mr-1" />
              Join
            </Button>
          </div>
        )}
      </div>

      {/* Bottom resize handle - improved visibility */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize transition-all flex items-center justify-center z-10",
          "opacity-0 group-hover:opacity-100",
          textColor === "white" ? "hover:bg-white/50 bg-white/30" : "hover:bg-black/30 bg-black/20"
        )}
        onMouseDown={handleResizeBottom}
        data-resize="bottom"
        data-event-id={event.id}
      >
        <div className={cn(
          "w-8 h-0.5 rounded-full",
          textColor === "white" ? "bg-white/80" : "bg-black/60"
        )} />
      </div>
    </div>
  );
}
