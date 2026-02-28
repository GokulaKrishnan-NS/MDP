"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const traysRoutes_1 = __importDefault(require("./routes/traysRoutes"));
const dispenseRoutes_1 = __importDefault(require("./routes/dispenseRoutes"));
const hospitalRoutes_1 = __importDefault(require("./routes/hospitalRoutes"));
const app = (0, express_1.default)();
// Security + logging
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// ── API Routes (must come before static serving) ──────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        status: 'ok',
        service: 'Medicine Dispenser API',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/trays', traysRoutes_1.default);
app.use('/api/dispense', dispenseRoutes_1.default);
app.use('/api/hospitals', hospitalRoutes_1.default);
// ── Serve Vite Frontend (Single Origin) ───────────────────────────────────────
const FRONTEND_DIST = path_1.default.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express_1.default.static(FRONTEND_DIST));
// SPA catch-all — Express 4 compatible
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(FRONTEND_DIST, 'index.html'));
});
// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Global Error]', err.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});
exports.default = app;
