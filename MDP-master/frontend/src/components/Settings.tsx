import { useMedicineStore } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Bell,
  Clock,
  Phone,
  LogOut,
  Save,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { EmergencyButton } from "./EmergencyButton";

export function Settings() {
  const { settings, updateSettings } = useMedicineStore();

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!", {
      description: "Your preferences have been updated.",
    });
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>
        <EmergencyButton />
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                value={settings.user.name}
                onChange={(e) => updateSettings({ user: { ...settings.user, name: e.target.value } })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email Address</Label>
              <Input
                id="user-email"
                type="email"
                value={settings.user.email}
                onChange={(e) => updateSettings({ user: { ...settings.user, email: e.target.value } })}
                placeholder="Enter your email"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to receive medication reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive medication reminders via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked: boolean) => updateSettings({ emailNotifications: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive medication reminders via text message
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked: boolean) => updateSettings({ smsNotifications: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="reminder-before">Reminder Time</Label>
              <Select
                value={settings.reminderBefore}
                onValueChange={(value: string) => updateSettings({ reminderBefore: value })}
              >
                <SelectTrigger id="reminder-before">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">At scheduled time</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Send reminder notifications before scheduled medication time
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Format
            </CardTitle>
            <CardDescription>
              Choose your preferred time display format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="time-format">Time Display</Label>
              <Select
                value={settings.timeFormat}
                onValueChange={(value: '12h' | '24h') => updateSettings({ timeFormat: value })}
              >
                <SelectTrigger id="time-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Contact information for emergency notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency-name">Contact Name</Label>
              <Input
                id="emergency-name"
                value={settings.emergencyContact.name}
                onChange={(e) => updateSettings({
                  emergencyContact: { ...settings.emergencyContact, name: e.target.value }
                })}
                placeholder="Enter contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-phone">Phone Number</Label>
              <Input
                id="emergency-phone"
                type="tel"
                value={settings.emergencyContact.phone}
                onChange={(e) => updateSettings({
                  emergencyContact: { ...settings.emergencyContact, phone: e.target.value }
                })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-email">Email Address</Label>
              <Input
                id="emergency-email"
                type="email"
                value={settings.emergencyContact.email}
                onChange={(e) => updateSettings({
                  emergencyContact: { ...settings.emergencyContact, email: e.target.value }
                })}
                placeholder="Enter email address"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-900">
                This contact will be notified if you miss multiple consecutive doses
                or in case of system alerts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSaveSettings}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="sm:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* App Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">MedReminder v1.0.0</p>
              <p className="text-xs text-muted-foreground">
                Smart Medicine Dispenser System
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
