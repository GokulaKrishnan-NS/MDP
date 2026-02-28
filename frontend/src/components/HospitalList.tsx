import { useState } from 'react';
import type { Hospital } from '../types';
import { getCurrentPosition } from '../services/locationService';
import { api } from '../services/apiClient';

// Static fallback hospitals (used if geolocation fails)
const STATIC_HOSPITALS: Hospital[] = [
    { id: 1, name: 'General Hospital', address: 'City Centre', phone: null, distance_km: '2.5', maps_link: 'https://maps.google.com' },
    { id: 2, name: 'Community Clinic', address: 'North District', phone: null, distance_km: '4.1', maps_link: 'https://maps.google.com' },
];

export function HospitalList() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    async function findHospitals() {
        setLoading(true);
        setStatus('Getting your location…');
        const pos = await getCurrentPosition();
        if (!pos) {
            setStatus('Location unavailable — showing default hospitals.');
            setHospitals(STATIC_HOSPITALS);
            setLoading(false);
            return;
        }
        try {
            setStatus('Searching nearby hospitals…');
            const res = await api.getHospitals(pos.lat, pos.lng) as any;
            if (res.data?.length > 0) {
                setHospitals(res.data);
                setStatus(`Found ${res.data.length} hospital(s) near you.`);
            } else {
                setHospitals(STATIC_HOSPITALS);
                setStatus('None found nearby — showing defaults.');
            }
        } catch {
            setHospitals(STATIC_HOSPITALS);
            setStatus('Search failed — showing defaults.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-icon">🏥</span>
                <h2>Nearby Hospitals</h2>
            </div>

            <button className="btn btn--primary" onClick={findHospitals} disabled={loading}>
                {loading ? '⏳ Searching…' : '📍 Find Nearest Hospitals'}
            </button>
            {status && <p className="status-msg">{status}</p>}

            {hospitals.length > 0 && (
                <ul className="hospital-list">
                    {hospitals.map(h => (
                        <li key={h.id} className="hospital-item">
                            <div className="hospital-info">
                                <span className="hospital-name">{h.name}</span>
                                <span className="hospital-addr">{h.address}</span>
                                {h.phone && <a className="hospital-phone" href={`tel:${h.phone}`}>{h.phone}</a>}
                            </div>
                            <div className="hospital-actions">
                                <span className="hospital-dist">{h.distance_km} km</span>
                                <a className="btn btn--small btn--green" href={h.maps_link} target="_blank" rel="noreferrer">🗺 Maps</a>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
