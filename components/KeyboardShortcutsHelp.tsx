"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open?: boolean;
  onClose?: () => void;
}

export function KeyboardShortcutsHelp({ open: controlledOpen, onClose }: KeyboardShortcutsHelpProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleClose = onClose || (() => setInternalOpen(false));
  const handleOpen = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(true);
    }
  };
  
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: `${modKey} + ←`, description: "Previous week" },
    { keys: `${modKey} + →`, description: "Next week" },
    { keys: `${modKey} + T`, description: "Go to today" },
    { keys: "Double-click", description: "Create new event at time" },
    { keys: "?", description: "Show this help" },
    { keys: "Esc", description: "Close dialogs/sidebar" },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-lg bg-card hover:bg-accent z-30"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div 
            className="bg-card rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-muted rounded">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
