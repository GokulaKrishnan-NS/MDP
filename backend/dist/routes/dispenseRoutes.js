"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DispenseController_1 = require("../controllers/DispenseController");
const router = (0, express_1.Router)();
router.post('/', DispenseController_1.DispenseController.dispense);
exports.default = router;
