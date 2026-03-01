
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/authStore';
import { Bell, MapPin, Phone } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';

export function Permissions() {
    const navigate = useNavigate();
    const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

    const requestPermissions = async () => {
        try {
            // Mock/Real permission requests
            // We don't block on these, just best effort for now
            try {
                await LocalNotifications.requestPermissions();
            } catch (e) { console.error("Notification perm error", e); }

            try {
                await Geolocation.requestPermissions();
            } catch (e) { console.error("Geolocation perm error", e); }

            // Finish onboarding
            completeOnboarding();
            navigate('/');
        } catch (error) {
            console.error('Error requesting permissions:', error);
            // Navigate anyway
            completeOnboarding();
            navigate('/');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Permissions</CardTitle>
                    <CardDescription>We need access to a few things to help you</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <Bell className="w-6 h-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">Notifications</h3>
                                <p className="text-sm text-muted-foreground">To remind you when to take your medicine.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <MapPin className="w-6 h-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">Location</h3>
                                <p className="text-sm text-muted-foreground">To find nearby hospitals in an emergency.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Phone className="w-6 h-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">Phone Calls</h3>
                                <p className="text-sm text-muted-foreground">To call your emergency contact instantly.</p>
                            </div>
                        </div>

                        <Button onClick={requestPermissions} className="w-full mt-6" size="lg">
                            Allow & Finish
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
