
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

interface Hospital {
    id: string;
    name: string;
    address: string;
    distance: string;
    lat: number;
    lng: number;
}

// Mock hospitals data - in a real app, this would come from Google Places API
const MOCK_HOSPITALS: Hospital[] = [
    {
        id: '1',
        name: 'City General Hospital',
        address: '123 Medical Center Dr',
        distance: '1.2 km',
        lat: 40.7128,
        lng: -74.0060,
    },
    {
        id: '2',
        name: 'Saint Marys Medical Center',
        address: '456 Healthcare Ave',
        distance: '2.5 km',
        lat: 40.7282,
        lng: -73.9942,
    },
    {
        id: '3',
        name: 'Community Wellness Clinic',
        address: '789 Wellness Way',
        distance: '3.8 km',
        lat: 40.7369,
        lng: -74.0090,
    },
    {
        id: '4',
        name: 'Childrens Hope Hospital',
        address: '101 Kids Lane',
        distance: '5.0 km',
        lat: 40.7484,
        lng: -73.9857,
    },
    {
        id: '5',
        name: 'Veternary Emergency Group',
        address: '202 Pet Street',
        distance: '6.1 km',
        lat: 40.7589,
        lng: -73.9780,
    }
];

export function Hospitals() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // Silence unused variable warning for location until we use it in UI
    useEffect(() => {
        if (location) console.debug('Location updated:', location);
    }, [location]);

    useEffect(() => {
        const getCurrentLocation = async () => {
            try {
                const coordinates = await Geolocation.getCurrentPosition();
                setLocation({
                    lat: coordinates.coords.latitude,
                    lng: coordinates.coords.longitude
                });
            } catch (error) {
                console.error('Error getting location', error);
                // Fallback or just show mock list without sorting by real distance
            } finally {
                setLoading(false);
            }
        };

        getCurrentLocation();
    }, []);

    const openMap = (hospital: Hospital) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-4 space-y-4 pb-20">
            <h1 className="text-2xl font-bold mb-4">Nearby Hospitals</h1>

            {loading ? (
                <div className="flex justify-center p-8">
                    <span className="loading-spinner">Locating...</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {MOCK_HOSPITALS.map((hospital) => (
                        <Card key={hospital.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{hospital.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {hospital.address}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Approx. {hospital.distance}
                                    </div>
                                    <Button size="sm" onClick={() => openMap(hospital)}>
                                        <Navigation className="w-4 h-4 mr-2" />
                                        Navigate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
