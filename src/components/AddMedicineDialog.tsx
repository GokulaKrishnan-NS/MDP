import { useState } from "react";
import { useMedicineStore } from "../lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Pill, Package, Clock, Calendar, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMedicineDialog({ open, onOpenChange }: AddMedicineDialogProps) {
  const { addMedicine } = useMedicineStore();
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [compartment, setCompartment] = useState("");
  const [times, setTimes] = useState<string[]>([""]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleAddTime = () => {
    setTimes([...times, ""]);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!medicineName || !dosage || !compartment || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (times.some((t) => !t)) {
      toast.error("Please fill in all time slots or remove empty ones");
      return;
    }

    // Add to Store
    addMedicine({
      name: medicineName,
      dosage: dosage,
      compartment: parseInt(compartment),
      times: times,
      startDate: startDate,
      endDate: endDate
    });

    // Success
    toast.success("Medicine added successfully!", {
      description: `${medicineName} has been added to your schedule.`,
    });

    // Reset form
    setMedicineName("");
    setDosage("");
    setCompartment("");
    setTimes([""]);
    setStartDate("");
    setEndDate("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setMedicineName("");
    setDosage("");
    setCompartment("");
    setTimes([""]);
    setStartDate("");
    setEndDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            Add Medicine
          </DialogTitle>
          <DialogDescription>
            Add a new medicine to your dispensing schedule. Fill in all the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Medicine Name */}
            <div className="space-y-2">
              <Label htmlFor="medicine-name" className="flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medicine Name *
              </Label>
              <Input
                id="medicine-name"
                placeholder="e.g., Aspirin"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                required
              />
            </div>

            {/* Dosage */}
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                placeholder="e.g., 100mg or 2 tablets"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
              />
            </div>

            {/* Compartment */}
            <div className="space-y-2">
              <Label htmlFor="compartment" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Compartment / Slot Number *
              </Label>
              <Input
                id="compartment"
                type="number"
                min="1"
                max="20"
                placeholder="e.g., 1"
                value={compartment}
                onChange={(e) => setCompartment(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Select which compartment in the dispenser contains this medicine
              </p>
            </div>

            {/* Times */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Daily Times *
              </Label>
              <div className="space-y-2">
                {times.map((time, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      required
                      className="flex-1"
                    />
                    {times.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveTime(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTime}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Time
              </Button>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date *
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date *
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Save Medicine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
