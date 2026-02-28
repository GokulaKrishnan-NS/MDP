import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../services/apiClient';
import { logDispenseEvent } from '../utils/historyManager';
import { findActiveDoseSlot, isWithinDoseWindow, getNearestBlockedReason } from '../utils/timeWindow';
import { isDoseTaken, getTakenDosesForTray } from '../utils/doseTracker';

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

    // Compute taken status per tray (refreshes on each render)
    const takenMap = useMemo(() => {
        const map = new Map<number, Set<string>>();
        trays.forEach(t => map.set(t.trayId, getTakenDosesForTray(t.trayId)));
        return map;
    }, [trays]);

    function isTrayCurrentlyTaken(tray: typeof trays[0]): boolean {
        const times = Array.isArray(tray.doseTimes) && tray.doseTimes.length > 0
            ? tray.doseTimes
            : tray.scheduledTime ? [tray.scheduledTime] : [];
        if (times.length === 0) return false;
        const active = findActiveDoseSlot(times);
        if (!active) return false; // no active slot = not in window, not "taken"
        return isDoseTaken(tray.trayId, active.slot);
    }

    async function handleDispense(e: React.FormEvent) {
        e.preventDefault();
        if (!selected) { setError('Select a medicine first'); return; }
        setError(''); setMessage(''); setLoading(true);

        const tray = trays.find(t => t.medicineName === selected);
        const doseTimes: string[] = tray
            ? (Array.isArray(tray.doseTimes) && tray.doseTimes.length > 0
                ? tray.doseTimes
                : tray.scheduledTime ? [tray.scheduledTime] : [])
            : [];

        try {
            if (mode === 'mock') {
                dispense(selected); // full guard (time + taken) handled inside appStore
                setMessage(`✓ Dose dispensed (mock): ${selected}`);
            } else {
                // ── IoT path: mirror the same guards as the store ─────────
                if (doseTimes.length > 0) {
                    const active = findActiveDoseSlot(doseTimes);
                    if (!active) {
                        throw new Error(getNearestBlockedReason(doseTimes));
                    }
                    if (tray && isDoseTaken(tray.trayId, active.slot)) {
                        throw new Error(`✅ This dose (${active.slot}) has already been taken. ${getNearestBlockedReason(doseTimes)}`);
                    }
                } else if (tray?.scheduledTime) {
                    const win = isWithinDoseWindow(tray.scheduledTime);
                    if (!win.ok) {
                        logDispenseEvent(
                            { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                            tray.pillsPerDose,
                            win.status as 'blocked-early' | 'blocked-late',
                        );
                        throw new Error(win.message);
                    }
                }

                const res = await api.dispense(selected, 'iot') as any;
                if (tray) {
                    logDispenseEvent(
                        { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                        tray.pillsPerDose,
                        'success',
                    );
                }
                setMessage(`✓ Dose dispensed (IoT): ${res.data?.medicineName}. Pills remaining: ${res.data?.pillsRemaining}`);
            }
            setSelected('');
        } catch (err: any) {
            setError(err.message ?? 'Dispense failed — please try again.');
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
                        {trays.map(tray => {
                            const taken = isTrayCurrentlyTaken(tray);
                            const times = Array.isArray(tray.doseTimes) && tray.doseTimes.length > 0
                                ? tray.doseTimes
                                : tray.scheduledTime ? [tray.scheduledTime] : [];

                            return (
                                <button
                                    key={tray.trayId}
                                    type="button"
                                    className={[
                                        'tray-select-btn',
                                        selected === tray.medicineName ? 'tray-select-btn--active' : '',
                                        tray.pillsRemaining <= tray.threshold ? 'tray-select-btn--low' : '',
                                        taken ? 'tray-select-btn--taken' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => setSelected(tray.medicineName)}
                                >
                                    <span className="tray-select-name">{tray.medicineName}</span>
                                    <span className="tray-select-stock">{tray.pillsRemaining} pills</span>
                                    {taken && <span className="tray-taken-badge">✅ Taken</span>}
                                    {!taken && times.length > 0 && (
                                        <div className="tray-select-times">
                                            {times.map(t => (
                                                <span key={t} className={`tray-select-schedule ${takenMap.get(tray.trayId)?.has(t) ? 'tray-select-schedule--taken' : ''}`}>
                                                    {takenMap.get(tray.trayId)?.has(t) ? '✅' : '⏰'} {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
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
