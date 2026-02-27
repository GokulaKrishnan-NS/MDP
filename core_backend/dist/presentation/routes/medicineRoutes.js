"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MedicineController_1 = require("../controllers/MedicineController");
const router = (0, express_1.Router)();
// Create a new medicine
router.post('/', MedicineController_1.MedicineController.createMedicine);
exports.default = router;
