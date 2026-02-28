import { useEffect, useState } from 'react';
import { getDispenseHistory, clearDispenseHistory } from '../utils/historyManager';
import type { DispenseHistory } from '../types/DispenseHistory';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

const STATUS_META: Record<DispenseHistory['status'], { label: string; className: string; icon: string }> = {
    success: { label: 'Success', className: 'history-status--success', icon: '✓' },
    'blocked-early': { label: 'Too Early', className: 'history-status--early', icon: '⏰' },
    'blocked-late': { label: 'Missed', className: 'history-status--late', icon: '⛔' },
};

export function HistoryPanel() {
    const [history, setHistory] = useState<DispenseHistory[]>(() => getDispenseHistory());

    useEffect(() => {
        function refresh() {
            setHistory(getDispenseHistory());
        }
        window.addEventListener('dispenseHistoryUpdated', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('dispenseHistoryUpdated', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    function handleClear() {
        clearDispenseHistory();
    }

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-icon">📋</span>
                <h2>Dispense History</h2>
                {history.length > 0 && (
                    <button className="btn btn--danger btn--small" onClick={handleClear}>
                        🗑 Clear
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <p className="empty-state">No dispense events yet. Events appear here as you dispense.</p>
            ) : (
                <div className="history-table-wrap">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date &amp; Time</th>
                                <th>Medicine</th>
                                <th>Qty</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(entry => {
                                const meta = STATUS_META[entry.status];
                                return (
                                    <tr key={entry.id} className={`history-row history-row--${entry.status}`}>
                                        <td className="history-td history-td--date">{formatDate(entry.timestamp)}</td>
                                        <td className="history-td history-td--med">{entry.medicineName}</td>
                                        <td className="history-td history-td--qty">{entry.quantity}</td>
                                        <td className="history-td">
                                            <span className={`history-status ${meta.className}`}>
                                                {meta.icon} {meta.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
