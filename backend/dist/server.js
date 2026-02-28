"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`\n🚀 Medicine Dispenser API started`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://172.20.164.180:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});
