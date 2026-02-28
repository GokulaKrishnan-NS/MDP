import { useEffect, useState } from 'react';
import { api } from '../services/apiClient';
import type { DeviceStatus } from '../types/DeviceStatus';

interface Props {
    mode: 'mock' | 'iot';
}

const MOCK_STATUS: DeviceStatus = {
    batteryPercent: 78,
    connected: true,
    lastSync: new Date().toISOString(),
};

function BatteryIcon({ pct }: { pct: number }) {
    const color = pct > 50 ? 'var(--accent-green)' : pct > 20 ? 'var(--accent-orange)' : 'var(--accent-red)';
    const bars = Math.round((pct / 100) * 4);
    return (
        <span style={{ color, fontWeight: 800, fontSize: 32 }}>
            {'█'.repeat(bars)}{'░'.repeat(4 - bars)}
        </span>
    );
}

export function DeviceStatusPanel({ mode }: Props) {
    const [status, setStatus] = useState<DeviceStatus | null>(null);
    const [error, setError] = useState('');

    async function fetchStatus() {
        try {
            if (mode === 'mock') {
                // Return mock data with a fresh timestamp each tick
                setStatus({ ...MOCK_STATUS, lastSync: new Date().toISOString() });
            } else {
                const data = await api.getDeviceStatus() as DeviceStatus;
                setStatus(data);
            }
            setError('');
        } catch {
            if (mode === 'iot') {
                setError('Could not reach device — showing last known values.');
                // Fall back to mock values in IoT mode if endpoint not reachable
                setStatus(prev => prev ?? { ...MOCK_STATUS, connected: false, lastSync: new Date().toISOString() });
            }
        }
    }

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10_000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-icon">🔋</span>
                <h2>Device Status</h2>
                <span className="device-refresh-hint">auto-refresh 10s</span>
            </div>

            {error && <p className="form-warning" style={{ marginBottom: 14 }}>⚠️ {error}</p>}

            {!status ? (
                <p className="empty-state">Loading device status…</p>
            ) : (
                <div className="device-cards">
                    {/* Battery */}
                    <div className="device-card">
                        <div className="device-card-label">Battery</div>
                        <BatteryIcon pct={status.batteryPercent} />
                        <div className="device-card-value">{status.batteryPercent}%</div>
                    </div>

                    {/* Connection */}
                    <div className="device-card">
                        <div className="device-card-label">Connection</div>
                        <span
                            className="status-dot"
                            style={{ background: status.connected ? 'var(--accent-green)' : 'var(--accent-red)' }}
                        />
                        <div className="device-card-value" style={{ color: status.connected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {status.connected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>

                    {/* Last Sync */}
                    <div className="device-card">
                        <div className="device-card-label">Last Sync</div>
                        <div className="device-card-icon">🕐</div>
                        <div className="device-card-value device-card-value--small">
                            {new Date(status.lastSync).toLocaleTimeString(undefined, {
                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
