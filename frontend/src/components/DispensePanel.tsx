import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../services/apiClient';
import { logDispenseEvent } from '../utils/historyManager';
import { isWithinDoseWindow } from '../utils/timeWindow';

interface Props {
    mode: 'mock' | 'iot';
}

export function DispensePanel({ mode }: Props) {
    const trays = useAppStore(s => s.trays);
    const dispense = useAppStore(s => s.dispense);
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleDispense(e: React.FormEvent) {
        e.preventDefault();
        if (!selected) { setError('Select a medicine first'); return; }
        setError(''); setMessage(''); setLoading(true);

        const tray = trays.find(t => t.medicineName === selected);

        try {
            if (mode === 'mock') {
                dispense(selected); // guard + logging handled inside appStore
                setMessage(`✓ Dose dispensed (mock): ${selected}`);
            } else {
                // IoT time-window guard (client-side)
                if (tray?.scheduledTime) {
                    const win = isWithinDoseWindow(tray.scheduledTime);
                    if (!win.ok) {
                        if (tray) logDispenseEvent(
                            { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                            tray.pillsPerDose,
                            win.status as 'blocked-early' | 'blocked-late',
                        );
                        throw new Error(win.message);
                    }
                }
                const res = await api.dispense(selected, 'iot') as any;
                if (tray) logDispenseEvent(
                    { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                    tray.pillsPerDose,
                    'success',
                );
                setMessage(`✓ Dose dispensed (IoT): ${res.data?.medicineName}. Pills remaining: ${res.data?.pillsRemaining}`);
            }
            setSelected('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-icon">💊</span>
                <h2>Dispense Medication</h2>
                <span className={`mode-badge mode-badge--${mode}`}>{mode.toUpperCase()}</span>
            </div>

            {trays.length === 0 ? (
                <p className="empty-state">Add trays first before dispensing.</p>
            ) : (
                <form className="dispense-form" onSubmit={handleDispense}>
                    <div className="tray-select-grid">
                        {trays.map(tray => (
                            <button
                                key={tray.trayId}
                                type="button"
                                className={`tray-select-btn ${selected === tray.medicineName ? 'tray-select-btn--active' : ''} ${tray.pillsRemaining <= tray.threshold ? 'tray-select-btn--low' : ''}`}
                                onClick={() => setSelected(tray.medicineName)}
                            >
                                <span className="tray-select-name">{tray.medicineName}</span>
                                <span className="tray-select-stock">{tray.pillsRemaining} pills</span>
                                {tray.scheduledTime && <span className="tray-select-schedule">⏰ {tray.scheduledTime}</span>}
                            </button>
                        ))}
                    </div>

                    {error && <p className="form-error">{error}</p>}
                    {message && <p className="form-success">{message}</p>}

                    <button className="btn btn--dispense" type="submit" disabled={loading || !selected}>
                        {loading ? '⏳ Dispensing…' : '💊 Dispense Dose'}
                    </button>
                </form>
            )}
        </div>
    );
}
