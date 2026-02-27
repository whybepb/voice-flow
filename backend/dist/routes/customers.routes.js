"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customers_controller_1 = require("../controllers/customers.controller");
const router = (0, express_1.Router)();
router.post('/', customers_controller_1.createCustomer);
router.get('/', customers_controller_1.getCustomers);
exports.default = router;
