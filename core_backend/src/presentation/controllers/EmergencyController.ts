import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Database } from '../../infrastructure/database/Database';

// Validates coordinate queries
const EmergencyLocationSchema = z.object({
    lat: z.string().transform(Number),
    lng: z.string().transform(Number)
});

export class EmergencyController {

    // Search OpenStreetMap Overpass API for nearby hospitals
    public static async getNearbyHospitals(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { lat, lng } = EmergencyLocationSchema.parse(req.query);

            // Radius in meters: search within 10km initially.
            const searchRadius = 10000;

            // Overpass QL to find amenities=hospital or clinic around the lat/lng
            const overpassQuery = `
                [out:json][timeout:10];
                (
                  node["amenity"="hospital"](around:${searchRadius},${lat},${lng});
                  way["amenity"="hospital"](around:${searchRadius},${lat},${lng});
                  node["amenity"="clinic"](around:${searchRadius},${lat},${lng});
                );
                out center;
            `;

            const apiUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

            // Note: In production you might want to cache this response in Redis or memory
            const fetchRes = await fetch(apiUrl);

            if (!fetchRes.ok) {
                throw new Error('Overpass API returned an error');
            }

            const data = await fetchRes.json();

            // Format standard response
            const hospitals = data.elements.map((el: any) => {
                const elementLat = el.lat || (el.center && el.center.lat);
                const elementLng = el.lon || (el.center && el.center.lon);

                // Haversine approx distance
                const distance = EmergencyController.calculateDistance(lat, lng, elementLat, elementLng);

                return {
                    id: el.id,
                    name: el.tags?.name || 'Unnamed Hospital',
                    address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || 'Address not available',
                    phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
                    distance_km: distance.toFixed(2),
                    maps_link: `https://www.google.com/maps?q=${elementLat},${elementLng}`
                };
            });

            // Sort by nearest
            hospitals.sort((a: any, b: any) => parseFloat(a.distance_km) - parseFloat(b.distance_km));

            res.status(200).json({
                success: true,
                message: 'Nearby hospitals retrieved',
                data: hospitals
            });

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: 'Invalid Coordinates', data: (error as any).errors });
            } else {
                console.error('Error fetching hospitals: ', error);
                res.status(500).json({ success: false, message: 'Failed to retrieve hospitals via external API' });
            }
        }
    }

    // Haversine formula for rough point-to-point distance in kilometers
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
