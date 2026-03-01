import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import traysRoutes from './routes/traysRoutes';
import dispenseRoutes from './routes/dispenseRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import iotRoutes from './routes/iotRoutes';

const app = express();

// Security + logging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── API Routes (must come before static serving) ──────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        status: 'ok',
        service: 'Medicine Dispenser API',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/trays', traysRoutes);
app.use('/api/dispense', dispenseRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/iot', iotRoutes);

// ── Serve Vite Frontend (Single Origin) ───────────────────────────────────────
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

// SPA catch-all — Express 4 compatible
app.get('*', (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Global Error]', err.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

export default app;
