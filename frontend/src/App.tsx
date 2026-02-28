import { useState } from 'react';
import { useAppStore } from './store/appStore';
import { ModeSelect } from './components/ModeSelect';
import { TrayManager } from './components/TrayManager';
import { DispensePanel } from './components/DispensePanel';
import { AlarmModal } from './components/AlarmModal';
import { HospitalList } from './components/HospitalList';
import { EmergencyContacts } from './components/EmergencyContacts';
import { HistoryPanel } from './components/HistoryPanel';
import { DeviceStatusPanel } from './components/DeviceStatusPanel';

type Tab = 'dispense' | 'trays' | 'hospitals' | 'contacts' | 'history' | 'device';

export default function App() {
  const mode = useAppStore(s => s.mode);
  const alarm = useAppStore(s => s.alarm);
  const setMode = useAppStore(s => s.setMode);
  const [tab, setTab] = useState<Tab>('dispense');

  // Not chosen yet — show mode selection
  if (!mode) return <ModeSelect />;

  return (
    <div className="app-shell">
      {/* Alarm modal renders on top of everything — requires acknowledgment */}
      {alarm.active && (
        <AlarmModal
          warnings={alarm.warnings}
          medicineName={alarm.medicineName}
          onFindHospital={() => setTab('hospitals')}
        />
      )}

      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">💊</span>
          <span className="topbar-title">MediDispense</span>
        </div>
        <div className="topbar-right">
          <span className={`mode-badge mode-badge--${mode}`}>{mode === 'iot' ? '🔌 IoT' : '🧪 Mock'}</span>
          <button className="btn btn--ghost btn--small" onClick={() => setMode(null)}>Switch Mode</button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        {([
          { id: 'dispense', label: '💊 Dispense' },
          { id: 'trays', label: '⚙️ Trays' },
          { id: 'hospitals', label: '🏥 Hospitals' },
          { id: 'contacts', label: '📞 Contacts' },
          { id: 'history', label: '📋 History' },
          { id: 'device', label: '🔋 Device' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? 'nav-tab--active' : ''}`} onClick={() => setTab(t.id as Tab)}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="app-main">
        {tab === 'dispense' && <DispensePanel mode={mode} />}
        {tab === 'trays' && <TrayManager />}
        {tab === 'hospitals' && <HospitalList />}
        {tab === 'contacts' && <EmergencyContacts />}
        {tab === 'history' && <HistoryPanel />}
        {tab === 'device' && <DeviceStatusPanel mode={mode} />}
      </main>
    </div>
  );
}
