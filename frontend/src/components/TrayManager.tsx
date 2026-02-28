import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { scheduleAlarmNotification, cancelTrayNotifications } from '../services/notificationService';
import { getTakenDosesForTray } from '../utils/doseTracker';


interface Props {
    onSaved?: (warnings: string[]) => void;
}

const EMPTY_FORM = {
    medicineName: '', pillsRemaining: '', threshold: '3',
    pillsPerDose: '1', dosesPerDay: '2', durationDays: '7',
};

export function TrayManager({ onSaved }: Props) {
    const trays = useAppStore(s => s.trays);
    const addTray = useAppStore(s => s.addTray);
    const removeTray = useAppStore(s => s.removeTray);

    const [form, setForm] = useState(EMPTY_FORM);
    const [doseTimes, setDoseTimes] = useState<string[]>(['']);
    const [error, setError] = useState('');
    const [saveWarnings, setSaveWarnings] = useState<string[]>([]);

    const courseRequired = Number(form.pillsPerDose) * Number(form.dosesPerDay) * Number(form.durationDays);
    const maxSlots = Math.min(Number(form.dosesPerDay) || 1, 8);

    function updateDoseTime(idx: number, val: string) {
        setDoseTimes(prev => prev.map((t, i) => i === idx ? val : t));
    }

    function addDoseSlot() {
        if (doseTimes.length < maxSlots) setDoseTimes(prev => [...prev, '']);
    }

    function removeDoseSlot(idx: number) {
        setDoseTimes(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
    }

    function validateDoseTimes(): string | null {
        const filled = doseTimes.filter(Boolean);
        if (filled.length === 0) return null; // optional — no times = no time-locking
        const invalid = filled.find(t => !/^\d{2}:\d{2}$/.test(t));
        if (invalid) return `Invalid time format: "${invalid}" — use HH:MM (24h)`;
        const sorted = [...filled].sort();
        for (let i = 1; i < sorted.length; i++) {
            const [h1, m1] = sorted[i - 1].split(':').map(Number);
            const [h2, m2] = sorted[i].split(':').map(Number);
            const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (diff < 30) return `Doses "${sorted[i - 1]}" and "${sorted[i]}" are less than 30 minutes apart.`;
        }
        const dupes = filled.filter((t, i, a) => a.indexOf(t) !== i);
        if (dupes.length) return `Duplicate dose time: "${dupes[0]}"`;
        return null;
    }

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(''); setSaveWarnings([]);

        if (!form.medicineName.trim()) { setError('Medicine name is required'); return; }
        if (Number(form.pillsRemaining) <= 0) { setError('Pills must be > 0'); return; }
        if (Number(form.pillsPerDose) <= 0) { setError('Pills per dose must be > 0'); return; }
        if (Number(form.dosesPerDay) <= 0) { setError('Doses per day must be > 0'); return; }
        if (Number(form.durationDays) <= 0) { setError('Duration must be > 0'); return; }
        if (Number(form.threshold) >= Number(form.pillsRemaining)) {
            setError('Threshold must be less than initial pills'); return;
        }

        const timeError = validateDoseTimes();
        if (timeError) { setError(timeError); return; }

        const filledTimes = doseTimes.filter(Boolean);

        try {
            const { warnings } = addTray({
                medicineName: form.medicineName,
                pillsRemaining: Number(form.pillsRemaining),
                threshold: Number(form.threshold),
                pillsPerDose: Number(form.pillsPerDose),
                dosesPerDay: Number(form.dosesPerDay),
                durationDays: Number(form.durationDays),
                doseTimes: filledTimes,
                ...(filledTimes[0] ? { scheduledTime: filledTimes[0] } : {}),
            });
            setSaveWarnings(warnings);
            const newId = trays.length + 1;

            // Schedule a notification per dose slot
            filledTimes.forEach(slot => {
                scheduleAlarmNotification(newId, form.medicineName, slot).catch(console.warn);
            });

            setForm(EMPTY_FORM);
            setDoseTimes(['']);
            onSaved?.(warnings);
        } catch (err: any) {
            setError(err.message);
        }
    }

    function handleRemove(trayId: number) {
        cancelTrayNotifications(trayId).catch(console.warn);
        removeTray(trayId);
    }

    const f = (key: keyof typeof form, val: string) => setForm(p => ({ ...p, [key]: val }));

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-icon">⚙️</span>
                <h2>Tray Management</h2>
            </div>

            <form className="tray-form" onSubmit={handleAdd}>
                <div className="form-grid">
                    <div className="form-group form-group--wide">
                        <label>Medicine Name</label>
                        <input className="input" placeholder="e.g. Metformin 500mg" value={form.medicineName} onChange={e => f('medicineName', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Initial Pills</label>
                        <input className="input" type="number" min="1" placeholder="30" value={form.pillsRemaining} onChange={e => f('pillsRemaining', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Low Stock Threshold</label>
                        <input className="input" type="number" min="1" value={form.threshold} onChange={e => f('threshold', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Pills / Dose</label>
                        <input className="input" type="number" min="1" value={form.pillsPerDose} onChange={e => f('pillsPerDose', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Doses / Day</label>
                        <input className="input" type="number" min="1" max="8" value={form.dosesPerDay} onChange={e => { f('dosesPerDay', e.target.value); setDoseTimes(p => p.slice(0, Number(e.target.value))); }} />
                    </div>
                    <div className="form-group">
                        <label>Duration (days)</label>
                        <input className="input" type="number" min="1" value={form.durationDays} onChange={e => f('durationDays', e.target.value)} />
                    </div>
                </div>

                {/* ── Multi-dose time slots ─────────────────────────── */}
                <div className="dose-slots-section">
                    <div className="dose-slots-header">
                        <label className="dose-slots-label">⏰ Dose Times <span className="dose-slots-hint">(optional — 24h format)</span></label>
                        {doseTimes.length < maxSlots && (
                            <button type="button" className="btn btn--ghost btn--small" onClick={addDoseSlot}>
                                + Add Slot
                            </button>
                        )}
                    </div>
                    {doseTimes.map((t, idx) => (
                        <div key={idx} className="dose-slot-row">
                            <span className="dose-slot-num">Dose {idx + 1}</span>
                            <input
                                className="input input--time"
                                type="time"
                                value={t}
                                onChange={e => updateDoseTime(idx, e.target.value)}
                            />
                            {doseTimes.length > 1 && (
                                <button type="button" className="btn btn--icon btn--ghost" onClick={() => removeDoseSlot(idx)}>✕</button>
                            )}
                        </div>
                    ))}
                </div>

                {form.pillsRemaining && (
                    <div className="course-preview">
                        <span>📊 Course requires <strong>{courseRequired}</strong> pills</span>
                        {Number(form.pillsRemaining) < courseRequired && (
                            <span className="course-warning">⚠️ Stock insufficient for full course!</span>
                        )}
                    </div>
                )}

                {error && <p className="form-error">{error}</p>}
                {saveWarnings.map((w, i) => <p key={i} className="form-warning">{w}</p>)}

                <button className="btn btn--primary" type="submit">+ Add Tray</button>
            </form>

            {trays.length === 0 ? (
                <p className="empty-state">No trays configured. Add one above to get started.</p>
            ) : (
                <div className="tray-grid">
                    {trays.map(tray => {
                        const pct = Math.max(0, Math.round((tray.pillsRemaining / (tray.pillsRemaining + tray.pillsPerDose * 5 + 1)) * 100));
                        const isLow = tray.pillsRemaining <= tray.threshold;
                        const isCritical = tray.pillsRemaining < tray.courseTotalRequired;
                        const takenSlots = getTakenDosesForTray(tray.trayId);
                        const effectiveTimes = Array.isArray(tray.doseTimes) && tray.doseTimes.length > 0
                            ? tray.doseTimes
                            : tray.scheduledTime ? [tray.scheduledTime] : [];
                        return (
                            <div key={tray.trayId} className={`tray-card ${isLow ? 'tray-card--low' : ''} ${isCritical ? 'tray-card--critical' : ''}`}>
                                <div className="tray-card-header">
                                    <span className="tray-badge">Tray {tray.trayId}</span>
                                    <button className="btn btn--icon btn--ghost" onClick={() => handleRemove(tray.trayId)}>✕</button>
                                </div>
                                <h3 className="tray-medicine">{tray.medicineName}</h3>
                                <div className="tray-stat-row">
                                    <span>{tray.pillsRemaining} left</span>
                                    {isLow && <span className="tag tag--warn">LOW STOCK</span>}
                                    {isCritical && <span className="tag tag--danger">COURSE ❌</span>}
                                </div>
                                <div className="pill-bar">
                                    <div className="pill-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="tray-meta">
                                    <span>{tray.pillsPerDose}× / dose</span>
                                    <span>{tray.dosesPerDay}× / day</span>
                                    <span>{tray.durationDays} days</span>
                                </div>
                                {effectiveTimes.length > 0 && (
                                    <div className="tray-dose-times">
                                        {effectiveTimes.map(slot => (
                                            <span
                                                key={slot}
                                                className={`tray-schedule-badge ${takenSlots.has(slot) ? 'tray-schedule-badge--taken' : ''}`}
                                            >
                                                {takenSlots.has(slot) ? '✅' : '⏰'} {slot}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="tray-motor">{tray.motorCommand}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
