"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { startOfWeek, addWeeks, subWeeks, format, addDays, addMonths, parseISO, isBefore, isAfter, startOfDay } from "date-fns";
import { 
  CalendarEvent, 
  PIXELS_PER_SLOT, 
  MIN_EVENT_DURATION, 
  MAX_EVENT_DURATION, 
  MAX_TIME_SLOT,
  STORAGE_KEY,
  EVENT_COLORS
} from "@/types/event";
import { Sidebar } from "./Sidebar";
import { CalendarGrid } from "./CalendarGrid";
import { EventCard } from "./EventCard";
import { EditEventDialog } from "./EditEventDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { WeekNavigation } from "./WeekNavigation";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function CalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<{ id: string; title: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );
  const { showToast } = useToast();

  // Fetch events from API on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        showToast(data.error || 'Failed to load events', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showToast('Failed to connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const [resizing, setResizing] = useState<{
    eventId: string;
    direction: "top" | "bottom";
    startY: number;
    startDuration: number;
    startTimeSlot: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddEvent = async (newEvent: Omit<CalendarEvent, "id">) => {
    if (!newEvent.title.trim()) {
      showToast("Event title is required", "error");
      return;
    }
    
    if (newEvent.title.length > 100) {
      showToast("Title must be 100 characters or less", "error");
      return;
    }

    const event: CalendarEvent = {
      ...newEvent,
      id: `event-${Date.now()}-${Math.random()}`,
    };
    
    // If the event has repeat settings and is scheduled, generate recurring instances
    if (event.repeatType && event.repeatType !== "none" && event.day && event.timeSlot !== undefined && event.weekStart) {
      const recurringEvents = generateRecurringEvents(event);
      
      // Optimistic update
      setEvents((prev) => [...prev, ...recurringEvents]);
      
      try {
        // Save all recurring events to database
        await Promise.all(
          recurringEvents.map(evt => 
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(evt),
            })
          )
        );
        showToast(`Created ${recurringEvents.length} recurring events`, "success");
      } catch (error) {
        console.error('Failed to create recurring events:', error);
        showToast('Failed to save recurring events', 'error');
        // Rollback on error
        setEvents((prev) => prev.filter(e => !recurringEvents.find(re => re.id === e.id)));
      }
    } else {
      // Optimistic update
      setEvents((prev) => [...prev, event]);
      
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast("Event created successfully", "success");
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Failed to create event:', error);
        showToast('Failed to save event', 'error');
        // Rollback on error
        setEvents((prev) => prev.filter(e => e.id !== event.id));
      }
    }
  };
  
  // Generate recurring events based on repeat settings
  const generateRecurringEvents = (baseEvent: CalendarEvent): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const recurringGroupId = `recurring-${Date.now()}-${Math.random()}`;
    
    if (!baseEvent.weekStart || !baseEvent.day || baseEvent.timeSlot === undefined || !baseEvent.repeatType || baseEvent.repeatType === "none") {
      return [baseEvent];
    }
    
    const startDate = parseISO(baseEvent.weekStart);
    const dayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(baseEvent.day);
    const eventDate = addDays(startDate, dayIndex);
    
    // Default to 3 months if no end date specified
    const endDate = baseEvent.repeatEndDate 
      ? parseISO(baseEvent.repeatEndDate) 
      : addMonths(eventDate, 3);
    
    console.log('Generating recurring events:', {
      eventDate: format(eventDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      repeatType: baseEvent.repeatType,
      day: baseEvent.day
    });
    
    let currentDate = eventDate;
    let count = 0;
    const maxOccurrences = 100; // Safety limit
    
    while ((isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) && count < maxOccurrences) {
      const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayOfWeek = dayNames[currentDate.getDay()];
      
      events.push({
        ...baseEvent,
        id: `${recurringGroupId}-${count}`,
        weekStart: format(currentWeekStart, "yyyy-MM-dd"),
        day: dayOfWeek,
        isRecurring: true,
        recurringGroupId,
      });
      
      // Increment based on repeat type
      if (baseEvent.repeatType === "daily") {
        currentDate = addDays(currentDate, 1);
      } else if (baseEvent.repeatType === "weekly") {
        currentDate = addDays(currentDate, 7);
      } else if (baseEvent.repeatType === "monthly") {
        currentDate = addMonths(currentDate, 1);
      }
      
      count++;
    }
    
    console.log(`Generated ${events.length} recurring events`);
    
    return events;
  };

  const handleCreateEventAtTime = async (day: string, timeSlot: number) => {
    const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      title: "New Event",
      description: "",
      color: EVENT_COLORS[0],
      day,
      timeSlot,
      duration: 4, // 1 hour = 4 slots
      weekStart: weekStartStr,
    };
    
    // Optimistic update
    setEvents((prev) => [...prev, newEvent]);
    setEditingEvent(newEvent);
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast("Event created. Click to edit details.", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      showToast('Failed to save event', 'error');
      // Rollback on error
      setEvents((prev) => prev.filter(e => e.id !== newEvent.id));
      setEditingEvent(null);
    }
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    // Check if repeat settings are being added or changed
    const hasRepeatSettings = updatedEvent.repeatType && updatedEvent.repeatType !== "none";
    const isScheduled = updatedEvent.day && updatedEvent.timeSlot !== undefined && updatedEvent.weekStart;
    
    // Store previous state for rollback
    const previousEvents = [...events];
    
    // If this is a recurring event being updated, regenerate all instances
    if (updatedEvent.isRecurring && updatedEvent.recurringGroupId) {
      // Remove all events in the recurring group
      setEvents((prev) => {
        const filtered = prev.filter((e) => e.recurringGroupId !== updatedEvent.recurringGroupId);
        
        // If still has repeat settings, generate new recurring events
        if (hasRepeatSettings) {
          const newRecurringEvents = generateRecurringEvents(updatedEvent);
          return [...filtered, ...newRecurringEvents];
        } else {
          // No longer recurring, just add the single event
          return [...filtered, { ...updatedEvent, isRecurring: false, recurringGroupId: undefined }];
        }
      });
      
      try {
        // Delete all old recurring events
        const eventsToDelete = previousEvents.filter(e => e.recurringGroupId === updatedEvent.recurringGroupId);
        await Promise.all(
          eventsToDelete.map(evt => 
            fetch(`/api/events/${evt.id}`, { method: 'DELETE' })
          )
        );
        
        // Create new recurring events or single event
        if (hasRepeatSettings) {
          const newRecurringEvents = generateRecurringEvents(updatedEvent);
          await Promise.all(
            newRecurringEvents.map(evt => 
              fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(evt),
              })
            )
          );
        } else {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updatedEvent, isRecurring: false, recurringGroupId: undefined }),
          });
        }
        
        showToast("Recurring event series updated", "success");
      } catch (error) {
        console.error('Failed to update recurring events:', error);
        showToast('Failed to update recurring events', 'error');
        // Rollback
        setEvents(previousEvents);
      }
    } 
    // If a regular scheduled event is being converted to recurring, generate instances
    else if (hasRepeatSettings && isScheduled) {
      setEvents((prev) => {
        // Remove the original event
        const filtered = prev.filter((e) => e.id !== updatedEvent.id);
        
        // Generate recurring events
        const newRecurringEvents = generateRecurringEvents(updatedEvent);
        return [...filtered, ...newRecurringEvents];
      });
      
      try {
        // Delete original event
        await fetch(`/api/events/${updatedEvent.id}`, { method: 'DELETE' });
        
        // Create recurring events
        const newRecurringEvents = generateRecurringEvents(updatedEvent);
        await Promise.all(
          newRecurringEvents.map(evt => 
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(evt),
            })
          )
        );
        
        showToast(`Created ${newRecurringEvents.length} recurring events`, "success");
      } catch (error) {
        console.error('Failed to convert to recurring:', error);
        showToast('Failed to create recurring events', 'error');
        // Rollback
        setEvents(previousEvents);
      }
    } 
    // Regular update for non-recurring events
    else {
      setEvents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );
      
      try {
        const response = await fetch(`/api/events/${updatedEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEvent),
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast("Event updated successfully", "success");
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Failed to update event:', error);
        showToast('Failed to save changes', 'error');
        // Rollback
        setEvents(previousEvents);
      }
    }
  };

  const handleDeleteEvent = (id: string) => {
    const event = events.find((e) => e.id === id);
    if (event) {
      setDeletingEvent({ id, title: event.title });
    }
  };

  const confirmDelete = async () => {
    if (deletingEvent) {
      // Optimistic update
      const previousEvents = [...events];
      setEvents((prev) => prev.filter((e) => e.id !== deletingEvent.id));
      setDeletingEvent(null);
      
      try {
        const response = await fetch(`/api/events/${deletingEvent.id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast("Event deleted", "success");
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Failed to delete event:', error);
        showToast('Failed to delete event', 'error');
        // Rollback
        setEvents(previousEvents);
      }
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  
  const handleJumpToDate = (date: Date) => {
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close sidebar on Escape (mobile)
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      
      // Navigation shortcuts
      if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentWeekStart((prev) => subWeeks(prev, 1));
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentWeekStart((prev) => addWeeks(prev, 1));
      } else if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
      }
      
      // Toggle sidebar on 's' (desktop only)
      if (e.key === 's' && (e.metaKey || e.ctrlKey) && window.innerWidth >= 768) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      
      // Show keyboard shortcuts help on '?'
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
      
      // Close help on Escape
      if (e.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, showKeyboardHelp]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = events.find((e) => e.id === event.active.id);
    setActiveEvent(draggedEvent || null);
  };

  // Check if an event would overlap with existing events in the current week
  const checkCollision = (day: string, timeSlot: number, duration: number, excludeId?: string): boolean => {
    const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
    return events.some((e) => {
      if (e.id === excludeId || !e.day || e.timeSlot === undefined || !e.duration) return false;
      if (e.day !== day || e.weekStart !== weekStartStr) return false;
      
      const eventEnd = e.timeSlot + e.duration;
      const newEventEnd = timeSlot + duration;
      
      return (
        (timeSlot >= e.timeSlot && timeSlot < eventEnd) ||
        (newEventEnd > e.timeSlot && newEventEnd <= eventEnd) ||
        (timeSlot <= e.timeSlot && newEventEnd >= eventEnd)
      );
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const activeEvent = events.find((e) => e.id === active.id);
    if (!activeEvent) return;

    // Store previous state for rollback
    const previousEvents = [...events];

    // Dropping on calendar cell (scheduling or moving)
    if (typeof over.id === "string" && over.id.includes("-")) {
      const [day, timeSlot] = over.id.split("-");
      const newTimeSlot = parseInt(timeSlot);
      const duration = activeEvent.duration || 4; // Default to 1 hour (4 slots)
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      
      // Check for collision within the current week
      if (checkCollision(day, newTimeSlot, duration, active.id as string)) {
        showToast('Cannot schedule event: time slot conflict', 'error');
        return; // Don't schedule if there's a collision
      }
      
      // Check if this event has recurring settings and is being scheduled for the first time
      if (activeEvent.repeatType && activeEvent.repeatType !== "none" && !activeEvent.weekStart) {
        // This is an unscheduled recurring event being placed for the first time
        const scheduledEvent: CalendarEvent = {
          ...activeEvent,
          day,
          timeSlot: newTimeSlot,
          duration,
          weekStart: weekStartStr,
        };
        
        // Generate all recurring instances
        const recurringEvents = generateRecurringEvents(scheduledEvent);
        
        // Optimistic update: Remove the original event and add all recurring instances
        setEvents((prev) => [
          ...prev.filter((e) => e.id !== active.id),
          ...recurringEvents,
        ]);
        
        try {
          // Delete original event and create recurring events
          await fetch(`/api/events/${active.id}`, { method: 'DELETE' });
          await Promise.all(
            recurringEvents.map(evt => 
              fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(evt),
              })
            )
          );
          
          showToast(`Created ${recurringEvents.length} recurring events`, "success");
        } catch (error) {
          console.error('Failed to create recurring events:', error);
          showToast('Failed to save recurring events', 'error');
          // Rollback
          setEvents(previousEvents);
        }
      } else {
        // Regular event or moving an existing scheduled event
        const updatedEvent = { ...activeEvent, day, timeSlot: newTimeSlot, duration, weekStart: weekStartStr };
        
        // Optimistic update
        setEvents((prev) =>
          prev.map((e) =>
            e.id === active.id
              ? updatedEvent
              : e
          )
        );
        
        try {
          const response = await fetch(`/api/events/${active.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEvent),
          });
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error('Failed to update event:', error);
          showToast('Failed to save changes', 'error');
          // Rollback
          setEvents(previousEvents);
        }
      }
    }
    // Dropping back to sidebar (unscheduling)
    else if (over.id === "sidebar") {
      // If it's a recurring event, remove all instances in the group
      if (activeEvent.isRecurring && activeEvent.recurringGroupId) {
        const unscheduledEvent = {
          ...activeEvent,
          id: `event-${Date.now()}-${Math.random()}`,
          day: undefined,
          timeSlot: undefined,
          duration: undefined,
          weekStart: undefined,
          isRecurring: false,
          recurringGroupId: undefined,
        };
        
        // Optimistic update
        setEvents((prev) => {
          const filtered = prev.filter((e) => e.recurringGroupId !== activeEvent.recurringGroupId);
          return [...filtered, unscheduledEvent];
        });
        
        try {
          // Delete all recurring events
          const eventsToDelete = previousEvents.filter(e => e.recurringGroupId === activeEvent.recurringGroupId);
          await Promise.all(
            eventsToDelete.map(evt => 
              fetch(`/api/events/${evt.id}`, { method: 'DELETE' })
            )
          );
          
          // Create unscheduled event
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unscheduledEvent),
          });
          
          showToast("Recurring series unscheduled", "success");
        } catch (error) {
          console.error('Failed to unschedule recurring events:', error);
          showToast('Failed to save changes', 'error');
          // Rollback
          setEvents(previousEvents);
        }
      } else {
        const updatedEvent = { ...activeEvent, day: undefined, timeSlot: undefined, duration: undefined, weekStart: undefined };
        
        // Optimistic update
        setEvents((prev) =>
          prev.map((e) =>
            e.id === active.id
              ? updatedEvent
              : e
          )
        );
        
        try {
          const response = await fetch(`/api/events/${active.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEvent),
          });
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error('Failed to update event:', error);
          showToast('Failed to save changes', 'error');
          // Rollback
          setEvents(previousEvents);
        }
      }
    }
    // Reordering in sidebar
    else {
      const oldIndex = events.findIndex((e) => e.id === active.id);
      const newIndex = events.findIndex((e) => e.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setEvents((prev) => arrayMove(prev, oldIndex, newIndex));
        // Note: Reordering is UI-only, no need to persist to database
      }
    }
  };

  // Handle resize start
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const resizeHandle = target.closest("[data-resize]");
      
      if (resizeHandle) {
        e.preventDefault();
        const direction = resizeHandle.getAttribute("data-resize") as "top" | "bottom";
        const eventId = resizeHandle.getAttribute("data-event-id");
        
        if (eventId) {
          const event = events.find((ev) => ev.id === eventId);
          if (event && event.timeSlot !== undefined && event.duration) {
            setResizing({
              eventId,
              direction,
              startY: e.clientY,
              startDuration: event.duration,
              startTimeSlot: event.timeSlot,
            });
          }
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [events]);

  // Handle resize move
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const deltaSlots = Math.round(deltaY / PIXELS_PER_SLOT); // Changed from PIXELS_PER_HOUR to PIXELS_PER_SLOT

      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== resizing.eventId) return event;

          if (resizing.direction === "bottom") {
            // Resize from bottom - change duration
            const newDuration = Math.max(MIN_EVENT_DURATION, resizing.startDuration + deltaSlots);
            const clampedDuration = Math.min(MAX_EVENT_DURATION, newDuration);
            // Ensure event doesn't go beyond 23:45 (slot 95)
            const maxAllowedDuration = event.timeSlot !== undefined ? MAX_TIME_SLOT + 1 - event.timeSlot : MAX_EVENT_DURATION;
            return { ...event, duration: Math.min(clampedDuration, maxAllowedDuration) };
          } else {
            // Resize from top - change start time and duration
            const newTimeSlot = Math.max(0, Math.min(MAX_TIME_SLOT, resizing.startTimeSlot + deltaSlots));
            const newDuration = Math.max(MIN_EVENT_DURATION, resizing.startDuration - deltaSlots);
            return {
              ...event,
              timeSlot: newTimeSlot,
              duration: Math.min(MAX_EVENT_DURATION, newDuration),
            };
          }
        })
      );
    };

    const handleMouseUp = async () => {
      // Save the resized event to database
      const resizedEvent = events.find(e => e.id === resizing.eventId);
      if (resizedEvent) {
        try {
          const response = await fetch(`/api/events/${resizedEvent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resizedEvent),
          });
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error('Failed to save resize:', error);
          showToast('Failed to save changes', 'error');
        }
      }
      
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setResizing(null);
    };
  }, [resizing, events, showToast]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar
            events={events}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Mobile menu button */}
          <div className="md:hidden fixed top-4 left-4 z-30">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-10 w-10 rounded-full bg-card shadow-elevated"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <WeekNavigation
            currentWeekStart={currentWeekStart}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            onToday={handleToday}
            onJumpToDate={handleJumpToDate}
          />
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            </div>
          ) : (
            <CalendarGrid 
              events={events} 
              currentWeekStart={currentWeekStart}
              onEditEvent={setEditingEvent}
              onCreateEvent={handleCreateEventAtTime}
              activeEvent={activeEvent}
            />
          )}
        </div>
      </div>

      <DragOverlay>
        {activeEvent ? (
          <div className="shadow-floating animate-in">
            <EventCard event={activeEvent} isDragging />
          </div>
        ) : null}
      </DragOverlay>

      <EditEventDialog
        event={editingEvent}
        open={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={handleUpdateEvent}
      />

      <DeleteConfirmDialog
        open={!!deletingEvent}
        eventTitle={deletingEvent?.title || ""}
        onClose={() => setDeletingEvent(null)}
        onConfirm={confirmDelete}
      />
      
      <KeyboardShortcutsHelp 
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </DndContext>
  );
}
