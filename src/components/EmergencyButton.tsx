
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EmergencyDialog } from './EmergencyDialog';

export function EmergencyButton({ className }: { className?: string }) {
    const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);

    return (
        <>
            <Button
                variant="destructive"
                size="lg"
                className={`rounded-full shadow-lg gap-2 ${className}`}
                onClick={() => setIsEmergencyDialogOpen(true)}
            >
                <Phone className="w-5 h-5 animate-pulse" />
                <span className="font-bold">SOS CALL</span>
            </Button>

            <EmergencyDialog
                open={isEmergencyDialogOpen}
                onOpenChange={setIsEmergencyDialogOpen}
            />
        </>
    );
}
