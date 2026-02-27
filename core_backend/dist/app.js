"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dispenseRoutes_1 = __importDefault(require("./presentation/routes/dispenseRoutes"));
const userRoutes_1 = __importDefault(require("./presentation/routes/userRoutes"));
const scheduleRoutes_1 = __importDefault(require("./presentation/routes/scheduleRoutes"));
const medicineRoutes_1 = __importDefault(require("./presentation/routes/medicineRoutes"));
const app = (0, express_1.default)();
// Enable CORS for frontend connectivity
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/v1', dispenseRoutes_1.default);
app.use('/api/v1/user', userRoutes_1.default);
app.use('/api/v1/schedules', scheduleRoutes_1.default);
app.use('/api/v1/medicines', medicineRoutes_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});
exports.default = app;
