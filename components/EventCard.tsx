"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarEvent } from "@/types/event";
import { Card } from "@/components/ui/card";
import { GripVertical, Trash2, MapPin, Link as LinkIcon, Users, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContrastTextColor, cn } from "@/lib/utils";

interface EventCardProps {
  event: CalendarEvent;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

export function EventCard({ event, onDelete, isDragging }: EventCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: event.id });

  const textColor = getContrastTextColor(event.color);
  const textClass = textColor === "white" ? "text-white" : "text-black";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: event.color,
    opacity: isDragging || isSortableDragging ? 0.6 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 mb-3 relative group transition-all hover:shadow-lg",
        isDragging || isSortableDragging && "shadow-2xl scale-105 rotate-2"
      )}
      {...attributes}
    >
      <div className="flex flex-col gap-2">
        {/* Header with title and delete button */}
        <div className="flex items-start gap-2" {...listeners}>
          <GripVertical className={cn(
            "h-4 w-4 flex-shrink-0 mt-0.5 transition-opacity cursor-move",
            "opacity-60 group-hover:opacity-100 md:opacity-60",
            textColor === "white" ? "text-white/90" : "text-black/70"
          )} />
          <div className="flex-1 min-w-0 cursor-move">
            <h3 className={cn("font-semibold text-sm leading-tight truncate", textClass)}>
              {event.title}
            </h3>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 transition-all flex-shrink-0 rounded-md touch-manipulation",
                "opacity-70 md:opacity-0 md:group-hover:opacity-100",
                textColor === "white" ? "hover:bg-white/20" : "hover:bg-black/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(event.id);
              }}
              aria-label={`Delete ${event.title}`}
            >
              <Trash2 className={cn("h-3 w-3", textClass)} />
            </Button>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className={cn(
            "text-xs leading-snug pl-6 cursor-move line-clamp-2",
            textColor === "white" ? "text-white/90" : "text-black/80"
          )} {...listeners}>
            {event.description}
          </p>
        )}

        {/* Event Details */}
        {(event.location || event.attendees || event.notes) && (
          <div className="space-y-1.5 pl-6 cursor-move" {...listeners}>
            {event.location && (
              <div className={cn(
                "flex items-start gap-1.5 text-xs",
                textColor === "white" ? "text-white/90" : "text-black/80"
              )}>
                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span className="leading-tight truncate">{event.location}</span>
              </div>
            )}
            {event.attendees && (
              <div className={cn(
                "flex items-start gap-1.5 text-xs",
                textColor === "white" ? "text-white/90" : "text-black/80"
              )}>
                <Users className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span className="leading-tight truncate">{event.attendees}</span>
              </div>
            )}
            {event.notes && (
              <div className={cn(
                "flex items-start gap-1.5 text-xs",
                textColor === "white" ? "text-white/90" : "text-black/80"
              )}>
                <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span className="leading-tight line-clamp-1">{event.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Meeting Link Button - Bottom Right */}
        {event.link && (
          <div className="flex justify-end pt-1 pl-6">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2.5 text-xs font-medium transition-all pointer-events-auto touch-manipulation",
                "opacity-90 md:opacity-0 md:group-hover:opacity-100",
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
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Join Meeting
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
