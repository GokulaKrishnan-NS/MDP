import { MedicineSchedule } from "../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Clock, Pill, Package, AlertCircle } from "lucide-react";
import { cn } from "./ui/utils";

interface MedicineCardProps {
  schedule: MedicineSchedule;
  onDispense: (schedule: MedicineSchedule) => void;
  isNext?: boolean;
}

export function MedicineCard({ schedule, onDispense, isNext }: MedicineCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dispensed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'dispensed':
        return 'Dispensed';
      case 'missed':
        return 'Missed';
      default:
        return status;
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-foreground">{schedule.medicineName}</h3>
                  <p className="text-sm text-muted-foreground">{schedule.dosage}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("ml-2", getStatusColor(schedule.status))}
              >
                {getStatusLabel(schedule.status)}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{schedule.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>Compartment {schedule.compartment}</span>
              </div>
            </div>

            {/* Next Dose Indicator */}
            {isNext && (
              <div className="flex items-center gap-2 mb-3 text-sm text-blue-700">
                <AlertCircle className="w-4 h-4" />
                <span>Next scheduled dose</span>
              </div>
            )}

            {/* Action Button */}
            {schedule.status === 'upcoming' && (
              <Button
                onClick={() => onDispense(schedule)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Dispense Now
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
