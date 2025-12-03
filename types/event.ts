export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  color: string;
  day?: string; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  timeSlot?: number; // Time slot in 15-minute increments (0-95: 0=00:00, 4=01:00, 8=02:00, etc.)
  duration?: number; // duration in 15-minute increments (1=15min, 2=30min, 4=1hr, etc.)
  weekStart?: string; // ISO date string for the Monday of the week (e.g., "2025-12-01")
  location?: string; // Physical or virtual location
  link?: string; // Meeting link (Zoom, Google Meet, etc.) or related URL
  notes?: string; // Additional notes or details
  attendees?: string; // Comma-separated list of attendees
  repeatType?: "none" | "daily" | "weekly" | "monthly"; // Repeat frequency
  repeatEndDate?: string; // ISO date string for when the recurrence ends
  isRecurring?: boolean; // Whether this is part of a recurring series
  recurringGroupId?: string; // ID to group recurring events together
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => i); // 96 slots for 15-minute intervals (24 hours * 4)

export const EVENT_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

// Calendar constants
export const PIXELS_PER_HOUR = 80; // 80px per hour (4 slots * 20px)
export const PIXELS_PER_SLOT = 20; // 20px per 15-minute slot (improved from 15px for better clickability)
export const MIN_EVENT_DURATION = 1; // 1 slot = 15 minutes
export const MAX_EVENT_DURATION = 48; // 48 slots = 12 hours
export const MAX_TIME_SLOT = 95; // 95 = 23:45
export const STORAGE_KEY = 'calendar-events';

// Helper function to convert time slot to hour and minute
export function slotToTime(slot: number): { hour: number; minute: number } {
  const hour = Math.floor(slot / 4);
  const minute = (slot % 4) * 15;
  return { hour, minute };
}

// Helper function to convert hour and minute to slot
export function timeToSlot(hour: number, minute: number): number {
  return hour * 4 + Math.floor(minute / 15);
}

// Format time slot as string (e.g., "09:15")
export function formatTimeSlot(slot: number): string {
  const { hour, minute } = slotToTime(slot);
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}
