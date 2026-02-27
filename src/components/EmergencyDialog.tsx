import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Phone, MapPin, Loader2, Hospital } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
import { apiClient } from '@/lib/apiClient';

interface HospitalData {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    distance_km: string;
    maps_link: string;
}

interface EmergencyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EmergencyDialog({ open, onOpenChange }: EmergencyDialogProps) {
    const emergencyContact = useAuthStore((state) => state.user?.emergencyContact);

    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [hospitals, setHospitals] = useState<HospitalData[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

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

    const findNearbyHospitals = async () => {
        setLoadingHospitals(true);
        setHasSearched(true);
        try {
            // 1. Check permissions and get Location from Capacitor
            const permissions = await Geolocation.checkPermissions();
            if (permissions.location !== 'granted') {
                const request = await Geolocation.requestPermissions();
                if (request.location !== 'granted') {
                    throw new Error('Location permission denied');
                }
            }

            const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            const { latitude, longitude } = position.coords;

            // 2. Sync Location to backend for persistence (fire and forget)
            apiClient('/emergency/location', {
                method: 'POST',
                body: JSON.stringify({ latitude, longitude, address: "Emergency Trigger" })
            }).catch(e => console.error("Failed to sync location to DB:", e));

            // 3. Fetch Hospitals using the proximity search
            const res = await apiClient(`/emergency/nearby-hospitals?lat=${latitude}&lng=${longitude}`, {
                method: 'GET'
            });

            if (res.ok && res.data.success) {
                setHospitals(res.data.data);
                if (res.data.data.length === 0) {
                    toast.info("No hospitals found within 10km.");
                }
            } else {
                throw new Error(res.data.message || "Backend proxy failure");
            }

        } catch (error: any) {
            console.error(error);
            toast.error('Failed to find hospitals', {
                description: error.message || 'Ensure your GPS is enabled and permissions are granted.',
            });
            // Graceful fallback for completely offline or failed API
            setHospitals([]);
        } finally {
            setLoadingHospitals(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2 text-xl">
                        <AlertCircleIcon className="w-6 h-6" />
                        Emergency Services
                    </DialogTitle>
                    <DialogDescription>
                        Trigger immediate emergency actions or find nearby medical centers.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-4">
                    {/* SOS Action */}
                    <Button
                        variant="destructive"
                        size="lg"
                        className="w-full text-lg py-6"
                        onClick={handleEmergencyCall}
                    >
                        <Phone className="w-6 h-6 mr-2 animate-pulse" />
                        Call Emergency Contact
                    </Button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-muted"></div>
                        <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm uppercase">or</span>
                        <div className="flex-grow border-t border-muted"></div>
                    </div>

                    {/* Hospital Search Action */}
                    {!hasSearched ? (
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full py-6 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={findNearbyHospitals}
                        >
                            <MapPin className="w-5 h-5 mr-2" />
                            Find Nearby Hospitals (5-10km)
                        </Button>
                    ) : loadingHospitals ? (
                        <div className="flex flex-col items-center justify-center p-6 space-y-4 rounded-lg bg-slate-50 border border-slate-100">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-sm text-slate-600 font-medium animate-pulse">Scanning area via OpenStreetMap...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="font-semibold flex items-center text-sm text-slate-700 sticky top-0 bg-white py-2 z-10 border-b">
                                <Hospital className="w-4 h-4 mr-2 text-blue-500" />
                                Top Nearest Facilities
                            </h4>
                            {hospitals.map((hospital) => (
                                <div key={hospital.id} className="p-3 border rounded-lg hover:border-blue-300 transition-colors bg-white">
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="font-semibold text-sm leading-tight text-slate-900 line-clamp-2">{hospital.name}</h5>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                            {hospital.distance_km} km
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-1">{hospital.address}</p>

                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full text-xs h-8"
                                            onClick={() => window.open(hospital.maps_link, '_system')}
                                        >
                                            <MapPin className="w-3 h-3 mr-1" /> View Map
                                        </Button>
                                        {hospital.phone && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-xs h-8 px-0"
                                                onClick={() => window.open(`tel:${hospital.phone}`, '_system')}
                                            >
                                                <Phone className="w-3 h-3 text-green-600" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AlertCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
    )
}
