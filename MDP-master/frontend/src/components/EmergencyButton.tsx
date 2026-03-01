
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { CallNumber } from '@capacitor-community/call-number'; // Removed dependency
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/authStore';

export function EmergencyButton({ className }: { className?: string }) {
    const emergencyContact = useAuthStore((state) => state.user?.emergencyContact);

    const handleEmergencyCall = async () => {
        if (!emergencyContact?.phone) {
            toast.error('No emergency contact saved!', {
                description: 'Please go to Settings to add one.',
            });
            return;
        }

        try {
            window.open(`tel:${emergencyContact.phone}`, '_system');
        } catch (error) {
            console.error('Error making call', error);
            toast.error('Failed to initiate call', {
                description: 'Please dial manually: ' + emergencyContact.phone,
            });
        }
    };

    return (
        <Button
            variant="destructive"
            size="lg"
            className={`rounded-full shadow-lg gap-2 ${className}`}
            onClick={handleEmergencyCall}
        >
            <Phone className="w-5 h-5 animate-pulse" />
            <span className="font-bold">SOS CALL</span>
        </Button>
    );
}
