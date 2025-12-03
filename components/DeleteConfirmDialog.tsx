"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  eventTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  eventTitle,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] space-section">
        <DialogHeader className="space-item">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-2xl">Delete Event?</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">"{eventTitle}"</span>?
            {" "}This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="min-w-[100px]"
            autoFocus
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="min-w-[100px]"
          >
            Delete Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
