"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calllogs_controller_1 = require("../controllers/calllogs.controller");
const router = (0, express_1.Router)();
router.get('/', calllogs_controller_1.getCallLogs);
router.get('/:id', calllogs_controller_1.getCallLogById);
exports.default = router;
