"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalController = void 0;
const zod_1 = require("zod");
const CoordSchema = zod_1.z.object({
    lat: zod_1.z.string().transform(Number),
    lng: zod_1.z.string().transform(Number),
});
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
class HospitalController {
    static async getNearby(req, res) {
        const parsed = CoordSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, message: 'lat and lng query params required' });
            return;
        }
        const { lat, lng } = parsed.data;
        try {
            const overpassQuery = `
                [out:json][timeout:10];
                (
                  node["amenity"="hospital"](around:10000,${lat},${lng});
                  way["amenity"="hospital"](around:10000,${lat},${lng});
                  node["amenity"="clinic"](around:10000,${lat},${lng});
                );
                out center;
            `;
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
            const response = await fetch(url);
            if (!response.ok)
                throw new Error('Overpass API error');
            const json = await response.json();
            const hospitals = json.elements.map((el) => {
                const eLat = el.lat ?? el.center?.lat;
                const eLon = el.lon ?? el.center?.lon;
                return {
                    id: el.id,
                    name: el.tags?.name ?? 'Unnamed Hospital',
                    address: el.tags?.['addr:full'] ?? el.tags?.['addr:street'] ?? 'Address not available',
                    phone: el.tags?.phone ?? null,
                    distance_km: haversine(lat, lng, eLat, eLon).toFixed(2),
                    maps_link: `https://www.google.com/maps?q=${eLat},${eLon}`,
                };
            }).sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
            res.json({ success: true, message: 'Hospitals retrieved', data: hospitals });
        }
        catch {
            res.status(503).json({ success: false, message: 'Unable to fetch hospitals. Please try again.' });
        }
    }
}
exports.HospitalController = HospitalController;
