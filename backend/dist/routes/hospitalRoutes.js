"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const HospitalController_1 = require("../controllers/HospitalController");
const router = (0, express_1.Router)();
router.get('/', HospitalController_1.HospitalController.getNearby);
exports.default = router;
