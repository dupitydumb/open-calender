"use client";

import { useState, useEffect } from "react";
import { CalendarEvent, EVENT_COLORS } from "@/types/event";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}

export function EditEventDialog({
  event,
  open,
  onClose,
  onSave,
}: EditEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(EVENT_COLORS[0]);
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState("");
  const [repeatType, setRepeatType] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [repeatEndDate, setRepeatEndDate] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setColor(event.color);
      setLocation(event.location || "");
      setLink(event.link || "");
      setNotes(event.notes || "");
      setAttendees(event.attendees || "");
      setRepeatType(event.repeatType || "none");
      setRepeatEndDate(event.repeatEndDate || "");
    }
  }, [event]);

  const handleSave = () => {
    if (!event || !title.trim()) return;

    onSave({
      ...event,
      title: title.trim(),
      description: description.trim(),
      color,
      location: location.trim(),
      link: link.trim(),
      notes: notes.trim(),
      attendees: attendees.trim(),
      repeatType,
      repeatEndDate: repeatType !== "none" ? repeatEndDate : undefined,
    });
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">Edit Event</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Title - Full Width */}
          <div>
            <label className="text-sm font-semibold mb-2 block text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              maxLength={100}
              className="h-11"
              autoFocus
              aria-required="true"
            />
            {title.length > 80 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5">
                {100 - title.length} characters remaining
              </p>
            )}
          </div>

          {/* Description - Full Width */}
          <div>
            <label className="text-sm font-semibold mb-2 block text-foreground">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (optional)"
              maxLength={200}
              className="h-11"
            />
            {description.length > 150 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5">
                {200 - description.length} characters remaining
              </p>
            )}
          </div>

          {/* Two Column Layout for Location and Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-foreground">
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (optional)"
                maxLength={100}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-foreground">
                Meeting Link
              </label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                maxLength={200}
                className="h-11"
                type="url"
              />
            </div>
          </div>

          {/* Two Column Layout for Attendees and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-foreground">
                Attendees
              </label>
              <Input
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="John, Sarah, Mike..."
                maxLength={200}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-foreground">
                Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
                maxLength={300}
                className="h-11"
              />
            </div>
          </div>

          {/* Two Column Layout for Repeat Type and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-foreground">
                Repeat
              </label>
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value as "none" | "daily" | "weekly" | "monthly")}
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {repeatType !== "none" && (
              <div>
                <label className="text-sm font-semibold mb-2 block text-foreground">
                  End Date
                </label>
                <Input
                  type="date"
                  value={repeatEndDate}
                  onChange={(e) => setRepeatEndDate(e.target.value)}
                  className="h-11"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          {/* Event Color */}
          <div>
            <label className="text-sm font-semibold mb-2 block text-foreground">
              Event Color
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-11 h-11 rounded-lg transition-all hover:scale-105 focus-ring ${
                    color === c
                      ? "scale-110 ring-2 ring-offset-2 ring-primary shadow-md"
                      : "hover:shadow-sm"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose} className="min-w-[100px]">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim()}
            className="min-w-[100px]"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
