"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["DISPENSE_SUCCESS"] = "DISPENSE_SUCCESS";
    EventType["DISPENSE_FAIL"] = "DISPENSE_FAIL";
    EventType["REFILL"] = "REFILL";
    EventType["THRESHOLD_ALERT"] = "THRESHOLD_ALERT";
    EventType["SCHEDULE_EDIT"] = "SCHEDULE_EDIT";
    EventType["EMERGENCY_OVERRIDE"] = "EMERGENCY_OVERRIDE";
})(EventType || (exports.EventType = EventType = {}));
