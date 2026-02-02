import { MedicineSchedule } from "../lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Pill, Package, Clock, CheckCircle2 } from "lucide-react";

interface DispenseConfirmDialogProps {
  schedule: MedicineSchedule | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DispenseConfirmDialog({
  schedule,
  onConfirm,
  onCancel,
}: DispenseConfirmDialogProps) {
  if (!schedule) return null;

  return (
    <Dialog open={!!schedule} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            Dispense Medication
          </DialogTitle>
          <DialogDescription>
            Confirm that you want to dispense this medication now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Medicine Details */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-foreground mb-3">{schedule.medicineName}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Pill className="w-4 h-4" />
                <span>Dosage: {schedule.dosage}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>Compartment: {schedule.compartment}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Scheduled: {schedule.scheduledTime}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-900">
                  The dispenser will release the medication from compartment{" "}
                  <strong>{schedule.compartment}</strong>.
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Please ensure you're ready to receive the medication.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            Confirm Dispense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
