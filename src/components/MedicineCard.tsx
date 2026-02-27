import { MedicineSchedule } from "../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Clock, Pill, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "./ui/utils";
import { getDispenseWindowState } from "../lib/scheduleService";

interface MedicineCardProps {
  schedule: MedicineSchedule;
  onDispense: (schedule: MedicineSchedule) => void;
  isNext?: boolean;
}

export function MedicineCard({ schedule, onDispense, isNext }: MedicineCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'taken': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'taken': return 'Taken';
      case 'missed': return 'Missed';
      case 'late': return 'Late';
      default: return status || 'Scheduled';
    }
  };

  // Use the centralized schedule service — single source of truth for time-window logic
  const windowState = getDispenseWindowState(schedule);

  const renderActionArea = () => {
    switch (windowState.state) {
      case 'too_early':
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">
            <Clock className="w-4 h-4 shrink-0 text-gray-400" />
            <span>{windowState.message}</span>
          </div>
        );
      case 'too_late':
        return (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{windowState.message}</span>
          </div>
        );
      case 'taken':
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700 border border-green-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{windowState.message}</span>
          </div>
        );
      case 'missed':
        return (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{windowState.message}</span>
          </div>
        );
      case 'ready':
        return (
          <Button
            type="button"
            onClick={() => onDispense(schedule)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            Dispense Now
          </Button>
        );
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isNext && "border-2 border-blue-500 shadow-lg ring-2 ring-blue-100"
      )}
    >
      <CardContent className="p-5">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">{schedule.medicineName || 'Medicine'}</h3>
                <p className="text-sm text-muted-foreground">{schedule.dosage}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn("ml-2 shrink-0", getStatusColor(schedule.status || 'scheduled'))}
            >
              {getStatusLabel(schedule.status || 'scheduled')}
            </Badge>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="w-4 h-4" />
            <span>{schedule.scheduled_time}</span>
          </div>

          {/* Next Dose Indicator */}
          {isNext && windowState.state === 'ready' && (
            <div className="flex items-center gap-2 mb-3 text-sm text-blue-700">
              <AlertCircle className="w-4 h-4" />
              <span>Time to take this dose!</span>
            </div>
          )}

          {/* Action area — delegated to scheduleService */}
          {renderActionArea()}
        </div>
      </CardContent>
    </Card>
  );
}
