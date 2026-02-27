import { useState, useEffect } from "react";
import { iotService } from "../lib/iot";
import { MedicineSchedule } from "../lib/types";
import { MedicineCard } from "./MedicineCard";
import { Button } from "./ui/button";
import { Plus, Calendar } from "lucide-react";
import { AddMedicineDialog } from "./AddMedicineDialog";
import { DispenseConfirmDialog } from "./DispenseConfirmDialog";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/apiClient";
import { EmergencyButton } from "./EmergencyButton";

export function Dashboard() {
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dispenseDialogSchedule, setDispenseDialogSchedule] = useState<MedicineSchedule | null>(null);

  const fetchSchedules = async () => {
    try {
      const response = await apiClient('/schedules', { method: 'GET' });
      if (response.ok && response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message, { description: error.type === 'NETWORK' ? 'Check that your phone and PC are on the same Wi-Fi network.' : undefined });
      } else {
        toast.error('Could not load schedules');
      }
      console.error('Failed to fetch schedules', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDispense = (schedule: MedicineSchedule) => {
    setDispenseDialogSchedule(schedule);
  };

  const confirmDispense = async () => {
    if (dispenseDialogSchedule) {
      const toastId = toast.loading("Verifying and dispensing medicine...", {
        description: `Dispensing ${dispenseDialogSchedule.medicineName}`
      });

      try {
        // 1. Call real backend API for validation and database logging
        const response = await apiClient('/dispense', {
          method: 'POST',
          body: JSON.stringify({
            schedule_id: dispenseDialogSchedule.id,
            timestamp: new Date().toISOString()
          }),
          headers: {
            'X-Idempotency-Key': crypto.randomUUID()
          }
        });

        if (response.ok && response.data.success) {
          // 2. ONLY if backend validates it, we fire the IoT command
          // The mock IoT service required a compartment originally. Defaulting to 1 for dummy pass.
          const iotResult = await iotService.dispense(1);

          if (iotResult.success) {
            toast.success("Dispensed successfully", { id: toastId });
            // Refresh schedules array to get new 'DISPENSED' status from server
            await fetchSchedules();
          } else {
            toast.error(iotResult.message, { id: toastId });
          }
        } else {
          toast.error(response.data.message || "Dispense Validation Failed", { id: toastId });
        }

      } catch (error) {
        if (error instanceof ApiError && error.type === 'NETWORK') {
          toast.error(error.message, { id: toastId, description: 'Ensure phone and backend are on the same Wi-Fi.' });
        } else {
          toast.error('Server error during dispense. Please try again.', { id: toastId });
        }
        console.error('Dispense error:', error);
      }

      setDispenseDialogSchedule(null);
    }
  };

  // Find next upcoming dose
  const upcomingSchedules = schedules.filter((s) => s.status?.toLowerCase() === 'scheduled');
  const nextSchedule = upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;

  // Separate by status
  const upcoming = schedules.filter((s) => s.status?.toLowerCase() === 'scheduled');
  const dispensed = schedules.filter((s) => s.status?.toLowerCase() === 'taken');
  const missed = schedules.filter((s) => s.status?.toLowerCase() === 'missed' || s.status?.toLowerCase() === 'late' || s.status?.toLowerCase() === 'blocked');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-foreground mb-2">Today's Medications</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">{formattedDate}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <EmergencyButton className="hidden md:flex" />
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </div>
        <div className="md:hidden mb-4">
          <EmergencyButton className="w-full" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
          <p className="text-3xl text-blue-600">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Dispensed</p>
          <p className="text-3xl text-green-600">{dispensed.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Missed</p>
          <p className="text-3xl text-red-600">{missed.length}</p>
        </div>
      </div>

      {/* Medicine Cards */}
      <div className="space-y-6">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-foreground mb-4">Upcoming Doses</h2>
            <div className="grid gap-4">
              {upcoming.map((schedule) => (
                <MedicineCard
                  key={schedule.id}
                  schedule={schedule}
                  onDispense={handleDispense}
                  isNext={schedule.id === nextSchedule?.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dispensed */}
        {dispensed.length > 0 && (
          <div>
            <h2 className="text-foreground mb-4">Dispensed Today</h2>
            <div className="grid gap-4">
              {dispensed.map((schedule) => (
                <MedicineCard
                  key={schedule.id}
                  schedule={schedule}
                  onDispense={handleDispense}
                />
              ))}
            </div>
          </div>
        )}

        {/* Missed */}
        {missed.length > 0 && (
          <div>
            <h2 className="text-foreground mb-4">Missed Doses</h2>
            <div className="grid gap-4">
              {missed.map((schedule) => (
                <MedicineCard
                  key={schedule.id}
                  schedule={schedule}
                  onDispense={handleDispense}
                />
              ))}
            </div>
          </div>
        )}

        {schedules.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">No medications scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Add your first medication to get started
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddMedicineDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <DispenseConfirmDialog
        schedule={dispenseDialogSchedule}
        onConfirm={confirmDispense}
        onCancel={() => setDispenseDialogSchedule(null)}
      />
    </div>
  );
}
