import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dispenseRoutes from './presentation/routes/dispenseRoutes';
import userRoutes from './presentation/routes/userRoutes';
import scheduleRoutes from './presentation/routes/scheduleRoutes';
import medicineRoutes from './presentation/routes/medicineRoutes';
import iotRoutes from './presentation/routes/iotRoutes';
import emergencyRoutes from './presentation/routes/emergencyRoutes';

const app = express();

// Security Headers & Request Logging
app.use(helmet());
app.use(morgan('dev'));

// CORS configuration for mobile API access
app.use(cors({ origin: '*' }));

// Input Validation limits (prevent massive payloads)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Timeout Handling Middleware
app.use((req, res, next) => {
    res.setTimeout(10000, () => {
        res.status(408).json({ success: false, message: 'Request Timeout' });
    });
    next();
});

// Routes
app.use('/api/v1/dispense', dispenseRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/medicines', medicineRoutes);
app.use('/api/v1/iot', iotRoutes);
app.use('/api/v1/emergency', emergencyRoutes);

// Global Error Handler Guard (Crash Prevention)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error Handle] ${err.name}: ${err.message}`, err.stack);

    // Ensure we send structured JSON back to the mobile client rather than raw HTML stacks
    res.status(500).json({
        success: false,
        message: 'Internal Application Error. Please construct your request properly.'
    });
});

export default app;
