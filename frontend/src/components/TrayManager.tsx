import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';

interface Props {
    onSaved?: (warnings: string[]) => void;
}

export function TrayManager({ onSaved }: Props) {
    const trays = useAppStore(s => s.trays);
    const addTray = useAppStore(s => s.addTray);
    const removeTray = useAppStore(s => s.removeTray);

    const [form, setForm] = useState({
        medicineName: '', pillsRemaining: '', threshold: '3',
        pillsPerDose: '1', dosesPerDay: '2', durationDays: '7',
    });
    const [error, setError] = useState('');
    const [saveWarnings, setSaveWarnings] = useState<string[]>([]);

    const courseRequired = Number(form.pillsPerDose) * Number(form.dosesPerDay) * Number(form.durationDays);

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

        try {
            const { warnings } = addTray({
                medicineName: form.medicineName,
                pillsRemaining: Number(form.pillsRemaining),
                threshold: Number(form.threshold),
                pillsPerDose: Number(form.pillsPerDose),
                dosesPerDay: Number(form.dosesPerDay),
                durationDays: Number(form.durationDays),
            });
            setSaveWarnings(warnings);
            setForm({ medicineName: '', pillsRemaining: '', threshold: '3', pillsPerDose: '1', dosesPerDay: '2', durationDays: '7' });
            onSaved?.(warnings);
        } catch (err: any) {
            setError(err.message);
        }
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
                        <input className="input" type="number" min="1" value={form.dosesPerDay} onChange={e => f('dosesPerDay', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Duration (days)</label>
                        <input className="input" type="number" min="1" value={form.durationDays} onChange={e => f('durationDays', e.target.value)} />
                    </div>
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
                        return (
                            <div key={tray.trayId} className={`tray-card ${isLow ? 'tray-card--low' : ''} ${isCritical ? 'tray-card--critical' : ''}`}>
                                <div className="tray-card-header">
                                    <span className="tray-badge">Tray {tray.trayId}</span>
                                    <button className="btn btn--icon btn--ghost" onClick={() => removeTray(tray.trayId)}>✕</button>
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
                                <div className="tray-motor">{tray.motorCommand}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
