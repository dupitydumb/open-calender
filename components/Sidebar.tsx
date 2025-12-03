"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CalendarEvent, EVENT_COLORS, slotToTime } from "@/types/event";
import { EventCard } from "./EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Calendar, Sparkles, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, addDays, isAfter, isBefore, startOfDay } from "date-fns";

interface SidebarProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
  onDeleteEvent: (id: string) => void;
}

export function Sidebar({ events, onAddEvent, onDeleteEvent }: SidebarProps) {
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(EVENT_COLORS[0]);
  const [showFullForm, setShowFullForm] = useState(false);
  const [repeatType, setRepeatType] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef } = useDroppable({ id: "sidebar" });

  // Focus title input when showing full form
  useEffect(() => {
    if (showFullForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showFullForm]);

  const handleAddEvent = () => {
    if (newEventTitle.trim()) {
      onAddEvent({
        title: newEventTitle,
        description: newEventDescription,
        color: selectedColor,
        repeatType,
        repeatEndDate: repeatType !== "none" ? repeatEndDate : undefined,
      });
      setNewEventTitle("");
      setNewEventDescription("");
      setShowFullForm(false);
      setRepeatType("none");
      setRepeatEndDate("");
    }
  };

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newEventTitle.trim()) {
      handleAddEvent();
    }
  };

  const unscheduledEvents = events.filter((e) => !e.day && !e.weekStart);

  // Get upcoming scheduled events (next 7 days)
  const getUpcomingEvents = () => {
    const now = new Date();
    const today = startOfDay(now);
    const currentTimeSlot = now.getHours() * 4 + Math.floor(now.getMinutes() / 15);
    
    const scheduledEvents = events.filter((e) => e.day && e.weekStart && e.timeSlot !== undefined);
    
    const upcomingEvents = scheduledEvents
      .map((event) => {
        const weekStart = parseISO(event.weekStart!);
        const dayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(event.day!);
        const eventDate = addDays(weekStart, dayIndex);
        
        return {
          ...event,
          eventDate,
          dateStr: format(eventDate, "yyyy-MM-dd"),
        };
      })
      .filter((event) => {
        const eventDateStart = startOfDay(event.eventDate);
        // Include today's events that haven't started yet, and all future events within 7 days
        if (eventDateStart.getTime() === today.getTime()) {
          return event.timeSlot! >= currentTimeSlot;
        }
        return isAfter(eventDateStart, today) && isBefore(eventDateStart, addDays(today, 8));
      })
      .sort((a, b) => {
        // Sort by date first, then by time slot
        if (a.dateStr !== b.dateStr) {
          return a.eventDate.getTime() - b.eventDate.getTime();
        }
        return (a.timeSlot || 0) - (b.timeSlot || 0);
      })
      .slice(0, 5); // Show only next 5 events
    
    return upcomingEvents;
  };

  const upcomingEvents = getUpcomingEvents();

  const formatEventTime = (event: CalendarEvent) => {
    if (event.timeSlot === undefined) return "";
    const { hour, minute } = slotToTime(event.timeSlot);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatEventDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());
    const eventDate = startOfDay(date);
    
    if (eventDate.getTime() === today.getTime()) {
      return "Today";
    } else if (eventDate.getTime() === addDays(today, 1).getTime()) {
      return "Tomorrow";
    } else {
      return format(date, "EEE, MMM d");
    }
  };

  return (
    <div className="w-full md:w-80 bg-sidebar border-r border-sidebar-border p-4 flex flex-col h-screen space-section">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Events</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowFullForm(!showFullForm)}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Add / Full Form */}
      <Card className="p-4 shadow-card space-item">
        {!showFullForm ? (
          // Quick add inline input
          <div className="space-y-2">
            <Input
              ref={titleInputRef}
              placeholder="Quick add event..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={handleQuickAdd}
              onFocus={() => setShowFullForm(true)}
              className="bg-background"
              maxLength={100}
            />
          </div>
        ) : (
          // Full form with all options
          <div className="space-item animate-in">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Create New Event
            </h3>
            <Input
              ref={titleInputRef}
              placeholder="Event title *"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="mb-2"
              onKeyDown={handleQuickAdd}
              maxLength={100}
              required
            />
            {newEventTitle.length > 80 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mb-2">
                {100 - newEventTitle.length} characters remaining
              </p>
            )}
            <Input
              placeholder="Description (optional)"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              className="mb-3"
              maxLength={200}
            />
            {newEventDescription.length > 150 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mb-2">
                {200 - newEventDescription.length} characters remaining
              </p>
            )}
            <div className="space-y-2 mb-3">
              <label className="text-xs font-medium text-muted-foreground">Repeat</label>
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value as "none" | "daily" | "weekly" | "monthly")}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {repeatType !== "none" && (
                <Input
                  type="date"
                  value={repeatEndDate}
                  onChange={(e) => setRepeatEndDate(e.target.value)}
                  placeholder="End date"
                  className="h-9 text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
            <div className="space-y-2 mb-3">
              <label className="text-xs font-medium text-muted-foreground">Select Color</label>
              <div className="flex gap-2 flex-wrap">
                {EVENT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-9 h-9 rounded-lg transition-all hover:scale-105 ${
                      selectedColor === color 
                        ? "scale-110 ring-2 ring-offset-2 ring-primary shadow-md" 
                        : "hover:shadow-sm"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddEvent} 
                className="flex-1" 
                size="sm"
                disabled={!newEventTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowFullForm(false);
                  setNewEventTitle("");
                  setNewEventDescription("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Event List */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-4">
        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="flex flex-col">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Events
            </h3>
            <div className="space-y-2 pr-4 max-h-[250px] overflow-y-auto">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderLeft: `4px solid ${event.color}` }}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm truncate">{event.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatEventDate(event.dateStr)}</span>
                      <span>•</span>
                      <span>{formatEventTime(event)}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Unscheduled Events Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Unscheduled ({unscheduledEvents.length})
          </h3>
          <ScrollArea className="flex-1">
            <div ref={setNodeRef} className="pr-4 space-y-2">
              <SortableContext
                items={unscheduledEvents.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {unscheduledEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDelete={onDeleteEvent}
                  />
                ))}
              </SortableContext>
              {unscheduledEvents.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-primary/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      No unscheduled events
                    </p>
                    <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
                      Create an event above and drag it to the calendar to schedule
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
