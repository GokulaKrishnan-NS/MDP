
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

interface Hospital {
    id: number | string;
    name: string;
    address: string;
    distance_km: number;
    phone: string | null;
    lat: number;
    lng: number;
}

// --- Haversine Formula ---
// Calculates the great-circle distance between two GPS points in kilometers.
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Real Overpass API Query ---
// Fetches hospitals & clinics within a radius around a coordinate using OpenStreetMap data.
async function fetchHospitalsFromOverpass(lat: number, lng: number, radiusMeters = 10000): Promise<Hospital[]> {
    const query = `
        [out:json][timeout:15];
        (
          node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
          way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
          node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
        );
        out center;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Overpass API responded with status ${res.status}`);
    const data = await res.json();

    const hospitals: Hospital[] = data.elements
        .map((el: any) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            if (!elLat || !elLng) return null;

            const distance = haversineDistanceKm(lat, lng, elLat, elLng);
            return {
                id: el.id,
                name: el.tags?.name || 'Unnamed Medical Facility',
                address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || 'Address not listed',
                phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
                distance_km: distance,
                lat: elLat,
                lng: elLng,
            };
        })
        .filter((h: Hospital | null): h is Hospital => h !== null)
        // Filter strictly within 5–10 km range (also include closer ones < 5km)
        .filter((h: Hospital) => h.distance_km <= 10)
        .sort((a: Hospital, b: Hospital) => a.distance_km - b.distance_km);

    return hospitals;
}

export function Hospitals() {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permDenied, setPermDenied] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        setPermDenied(false);

        try {
            // Step 1: Check permission
            let permStatus = await Geolocation.checkPermissions();

            // Step 2: Request if not granted
            if (permStatus.location !== 'granted') {
                permStatus = await Geolocation.requestPermissions();
            }

            // Step 3: Handle permanently denied
            if (permStatus.location === 'denied') {
                setPermDenied(true);
                setError('Location permission was denied. Please enable it in your device Settings to find nearby hospitals.');
                return;
            }

            if (permStatus.location !== 'granted') {
                setError('Location permission is required to find nearby hospitals.');
                return;
            }

            // Step 4: Get coordinates
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 12000,
            });

            const { latitude: lat, longitude: lng } = position.coords;
            setUserLocation({ lat, lng });

            // Step 5: Fetch REAL hospitals from OpenStreetMap Overpass API
            const results = await fetchHospitalsFromOverpass(lat, lng);
            setHospitals(results);

            if (results.length === 0) {
                setError('No hospitals or clinics found within 10 km of your location.');
            }

        } catch (err: any) {
            console.error('Hospitals load error:', err);
            if (err.message?.includes('permission') || err.code === 1) {
                setPermDenied(true);
                setError('Location permission denied. Please grant it in Settings.');
            } else if (err.message?.includes('Overpass') || err.message?.includes('timeout')) {
                setError('Could not reach the hospital directory (OpenStreetMap). Check your internet connection and try again.');
            } else {
                setError('Unable to locate nearby hospitals: ' + (err.message || 'Unknown error'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const openDirections = (hospital: Hospital) => {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;
        window.open(mapsUrl, '_system');
    };

    const callHospital = (phone: string) => {
        window.open(`tel:${phone}`, '_system');
    };

    return (
        <div className="p-4 space-y-4 pb-20">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">Nearby Hospitals</h1>
                {!loading && (
                    <Button variant="ghost" size="sm" onClick={loadData}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                )}
            </div>

            {/* Location Badge */}
            {userLocation && !loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-800">
                        Showing results within 10 km · {hospitals.length} found
                    </p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Scanning your area via OpenStreetMap...</p>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                    {!permDenied && (
                        <Button variant="outline" size="sm" onClick={loadData} className="w-full">
                            <RefreshCw className="w-3 h-3 mr-1" /> Try Again
                        </Button>
                    )}
                    {permDenied && (
                        <p className="text-xs text-red-600">Go to: <strong>Settings → Apps → Smart Medicine Reminder → Permissions → Location → Allow</strong></p>
                    )}
                </div>
            )}

            {/* Hospital List */}
            {!loading && !error && hospitals.length > 0 && (
                <div className="space-y-3">
                    {hospitals.map((hospital) => (
                        <Card key={hospital.id} className="border hover:border-blue-300 transition-colors">
                            <CardHeader className="pb-2 pt-4">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base leading-snug">{hospital.name}</CardTitle>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                                        {hospital.distance_km.toFixed(1)} km
                                    </span>
                                </div>
                                <CardDescription className="flex items-center gap-1 text-xs">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="line-clamp-1">{hospital.address}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1 text-xs h-9"
                                        onClick={() => openDirections(hospital)}
                                    >
                                        <Navigation className="w-3 h-3 mr-1" /> Directions
                                    </Button>
                                    {hospital.phone && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 px-3"
                                            onClick={() => callHospital(hospital.phone!)}
                                        >
                                            <Phone className="w-3 h-3 text-green-600" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
