"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calllogs_controller_1 = require("../controllers/calllogs.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authGuard, calllogs_controller_1.getCallLogs);
router.get('/:id', auth_middleware_1.authGuard, calllogs_controller_1.getCallLogById);
exports.default = router;
