import { useAppStore } from '../store/appStore';

export function ModeSelect() {
    const setMode = useAppStore(s => s.setMode);

    return (
        <div className="mode-select-screen">
            <div className="mode-select-content">
                <div className="app-logo">
                    <span className="logo-icon">💊</span>
                </div>
                <h1 className="app-title">Smart Medicine Dispenser</h1>
                <p className="app-subtitle">Choose how you'd like to proceed</p>

                <div className="mode-cards">
                    <button className="mode-card mode-card--mock" onClick={() => setMode('mock')}>
                        <div className="mode-card-icon">🧪</div>
                        <div className="mode-card-body">
                            <h2>Mock Mode</h2>
                            <p>Simulate dispenser behaviour without hardware. Perfect for testing and demonstration.</p>
                            <ul>
                                <li>✓ No IoT device required</li>
                                <li>✓ Full safety check simulation</li>
                                <li>✓ Works offline</li>
                            </ul>
                        </div>
                        <div className="mode-card-arrow">→</div>
                    </button>

                    <button className="mode-card mode-card--iot" onClick={() => setMode('iot')}>
                        <div className="mode-card-icon">🔌</div>
                        <div className="mode-card-body">
                            <h2>IoT Mode</h2>
                            <p>Connect to a real dispenser device. Backend validates all actions and sends motor commands.</p>
                            <ul>
                                <li>✓ Real hardware control</li>
                                <li>✓ Backend enforcement</li>
                                <li>✓ Motor command dispatch</li>
                            </ul>
                        </div>
                        <div className="mode-card-arrow">→</div>
                    </button>
                </div>

                <p className="mode-footer">
                    Your preference is saved locally and can be changed from Settings.
                </p>
            </div>
        </div>
    );
}
