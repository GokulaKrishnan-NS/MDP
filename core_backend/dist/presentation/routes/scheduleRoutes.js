"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ScheduleController_1 = require("../controllers/ScheduleController");
const router = (0, express_1.Router)();
// Get the daily schedules for the authenticated user
router.get('/', ScheduleController_1.ScheduleController.getDailySchedules);
exports.default = router;
