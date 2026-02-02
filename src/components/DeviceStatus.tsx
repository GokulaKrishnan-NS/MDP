import { useState, useEffect } from "react";
import { useMedicineStore } from "../lib/store";
import { iotService } from "../lib/iot";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Activity,
  Wifi,
  WifiOff,
  Battery,
  BatteryWarning,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Box,
} from "lucide-react";
import { toast } from "sonner";

export function DeviceStatus() {
  const { device, updateDeviceStatus } = useMedicineStore();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    toast.loading("Reconnecting to device...", { id: "reconnect" });

    try {
      const status = await iotService.checkStatus();
      updateDeviceStatus({
        isOnline: status.isOnline,
        batteryLevel: status.batteryLevel,
        lastSync: new Date().toISOString()
      });
      toast.success("Device reconnected successfully!", { id: "reconnect" });
    } catch (e) {
      toast.error("Failed to reconnect", { id: "reconnect" });
    } finally {
      setIsReconnecting(false);
    }
  };

  const getBatteryColor = () => {
    if (device.batteryLevel > 50) return "text-green-600";
    if (device.batteryLevel > 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryIcon = () => {
    if (device.batteryLevel <= 20) {
      return <BatteryWarning className={`w-8 h-8 ${getBatteryColor()}`} />;
    }
    return <Battery className={`w-8 h-8 ${getBatteryColor()}`} />;
  };

  // Mock compartment data (could be moved to store later if needed)
  const compartments = [
    { id: 1, medicine: "Aspirin", filled: true, remaining: 15 },
    { id: 2, medicine: "Metformin", filled: true, remaining: 12 },
    { id: 3, medicine: "Lisinopril", filled: true, remaining: 20 },
    { id: 4, medicine: "Vitamin D", filled: true, remaining: 25 },
    { id: 5, medicine: "Empty", filled: false, remaining: 0 },
    { id: 6, medicine: "Empty", filled: false, remaining: 0 },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground mb-2">Device Status</h1>
        <p className="text-muted-foreground">
          Monitor your Smart Medicine Dispenser connection and status
        </p>
      </div>

      {/* Connection Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {device.isOnline ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="text-foreground">Device Status</p>
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(device.lastSync).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  device.isOnline
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {device.isOnline ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>

            {/* Reconnect Button */}
            {!device.isOnline && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900 mb-3">
                  The device is currently offline. Please check the power connection
                  and network settings.
                </p>
                <Button
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isReconnecting ? "animate-spin" : ""}`}
                  />
                  Reconnect Device
                </Button>
              </div>
            )}

            {device.isOnline && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-900">
                      Device is connected and operating normally
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      All systems are functioning as expected
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Battery Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getBatteryIcon()}
            Battery Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Battery Level</span>
              <span className={`text-2xl ${getBatteryColor()}`}>
                {device.batteryLevel}%
              </span>
            </div>
            <Progress value={device.batteryLevel} className="h-3" />
            {device.batteryLevel <= 20 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BatteryWarning className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-900">Low battery warning</p>
                    <p className="text-xs text-red-700 mt-1">
                      Please charge the device soon to avoid interruption
                    </p>
                  </div>
                </div>
              </div>
            )}
            {device.batteryLevel > 20 && device.batteryLevel <= 50 && (
              <p className="text-sm text-muted-foreground">
                Battery level is adequate. Consider charging soon.
              </p>
            )}
            {device.batteryLevel > 50 && (
              <p className="text-sm text-muted-foreground">
                Battery level is good. No action needed.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compartment Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Compartment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {compartments.map((compartment) => (
              <div
                key={compartment.id}
                className={`rounded-lg border p-4 ${compartment.filled
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Slot {compartment.id}
                  </span>
                  {compartment.filled ? (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-600 border-gray-200 text-xs"
                    >
                      Empty
                    </Badge>
                  )}
                </div>
                <p className="text-foreground mb-1">{compartment.medicine}</p>
                {compartment.filled && (
                  <p className="text-xs text-muted-foreground">
                    {compartment.remaining} doses remaining
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Refill compartments when doses run low to ensure
              uninterrupted medication delivery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
