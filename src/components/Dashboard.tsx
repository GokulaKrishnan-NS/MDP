import { useState, useEffect } from "react";
import { useMedicineStore } from "../lib/store";
import { iotService } from "../lib/iot";
import { MedicineSchedule } from "../lib/types";
import { MedicineCard } from "./MedicineCard";
import { Button } from "./ui/button";
import { Plus, Calendar } from "lucide-react";
import { AddMedicineDialog } from "./AddMedicineDialog";
import { DispenseConfirmDialog } from "./DispenseConfirmDialog";
import { toast } from "sonner";

export function Dashboard() {
  const { schedules, updateScheduleStatus, addLog, generateDailySchedules } = useMedicineStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dispenseDialogSchedule, setDispenseDialogSchedule] = useState<MedicineSchedule | null>(null);

  useEffect(() => {
    // Generate schedules on mount (in a real app, this might be more sophisticated)
    generateDailySchedules();
  }, [generateDailySchedules]);

  const handleDispense = (schedule: MedicineSchedule) => {
    setDispenseDialogSchedule(schedule);
  };

  const confirmDispense = async () => {
    if (dispenseDialogSchedule) {
      const toastId = toast.loading("Dispensing medicine...", {
        description: `Dispensing ${dispenseDialogSchedule.medicineName} from compartment ${dispenseDialogSchedule.compartment}`
      });

      try {
        const result = await iotService.dispense(dispenseDialogSchedule.compartment);

        if (result.success) {
          // Update store
          updateScheduleStatus(dispenseDialogSchedule.id, 'dispensed');

          // Log to history
          addLog({
            date: new Date().toISOString(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            medicineName: dispenseDialogSchedule.medicineName,
            dosage: dispenseDialogSchedule.dosage,
            status: 'dispensed'
          });

          toast.success("Dispensed successfully", { id: toastId });
        } else {
          toast.error(result.message, { id: toastId });
        }
      } catch (error) {
        toast.error("Failed to communicate with device", { id: toastId });
      }

      setDispenseDialogSchedule(null);
    }
  };

  // Find next upcoming dose
  const upcomingSchedules = schedules.filter((s) => s.status === 'upcoming');
  const nextSchedule = upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;

  // Separate by status
  const upcoming = schedules.filter((s) => s.status === 'upcoming');
  const dispensed = schedules.filter((s) => s.status === 'dispensed');
  const missed = schedules.filter((s) => s.status === 'missed');

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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-foreground mb-2">Today's Medications</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">{formattedDate}</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medicine
          </Button>
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
