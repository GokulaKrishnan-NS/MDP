import { useEffect, useRef } from 'react';
import type { Warning } from '../types';
import { useAppStore } from '../store/appStore';

interface Props {
    warnings: Warning[];
    medicineName: string;
    onFindHospital: () => void;
}

export function AlarmModal({ warnings, medicineName, onFindHospital }: Props) {
    const acknowledgeAlarm = useAppStore(s => s.acknowledgeAlarm);
    const contacts = useAppStore(s => s.contacts);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Start alarm sound + vibration on mount
    useEffect(() => {
        // Web Audio API beep
        try {
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            function playBeep() {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
            playBeep();
            intervalRef.current = setInterval(playBeep, 800);
        } catch { /* AudioContext unavailable */ }

        // Vibration API
        if ('vibrate' in navigator) {
            navigator.vibrate([500, 200, 500, 200, 500]);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            audioCtxRef.current?.close();
            if ('vibrate' in navigator) navigator.vibrate(0);
        };
    }, []);

    function handleAcknowledge() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        audioCtxRef.current?.close();
        acknowledgeAlarm();
    }

    const hasLowStock = warnings.some(w => w.type === 'LOW_STOCK');
    const hasCourse = warnings.some(w => w.type === 'INSUFFICIENT_COURSE');

    return (
        <div className="alarm-overlay">
            <div className="alarm-modal">
                <div className="alarm-pulse-ring" />
                <div className="alarm-icon">{hasLowStock && hasCourse ? '🚨' : hasLowStock ? '⚠️' : '⛔'}</div>
                <h1 className="alarm-title">
                    {hasLowStock && hasCourse ? 'Critical Alert' : hasLowStock ? 'Low Stock Warning' : 'Course Warning'}
                </h1>
                <p className="alarm-medicine">Medicine: <strong>{medicineName}</strong></p>

                <div className="alarm-warnings">
                    {warnings.map((w, i) => (
                        <div key={i} className={`alarm-warning-card alarm-warning-card--${w.type === 'LOW_STOCK' ? 'low' : 'course'}`}>
                            <span className="alarm-warning-icon">{w.type === 'LOW_STOCK' ? '📉' : '💊'}</span>
                            <p>{w.message}</p>
                        </div>
                    ))}
                </div>

                <div className="alarm-actions">
                    {contacts.length > 0 && (
                        <a className="btn btn--alarm-call" href={`tel:${contacts[0].phone}`}>
                            📞 Call {contacts[0].name}
                        </a>
                    )}
                    <button className="btn btn--alarm-hospital" onClick={() => { handleAcknowledge(); onFindHospital(); }}>
                        🏥 Find Hospital
                    </button>
                    <button className="btn btn--alarm-ack" onClick={handleAcknowledge}>
                        ✓ I Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
}
