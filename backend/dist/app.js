"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customers_routes_1 = __importDefault(require("./routes/customers.routes"));
const bookings_routes_1 = __importDefault(require("./routes/bookings.routes"));
const campaign_routes_1 = __importDefault(require("./routes/campaign.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const voice_routes_1 = __importDefault(require("./routes/voice.routes"));
const calllogs_routes_1 = __importDefault(require("./routes/calllogs.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const app = (0, express_1.default)();
// Global Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // Twilio sends form-urlencoded
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/customers', customers_routes_1.default);
app.use('/bookings', bookings_routes_1.default);
app.use('/campaigns', campaign_routes_1.default);
app.use('/webhooks', webhook_routes_1.default);
app.use('/voice', voice_routes_1.default);
app.use('/call-logs', calllogs_routes_1.default);
app.use('/analytics', analytics_routes_1.default);
// Health Check
app.get('/', (req, res) => {
    res.send('API is running...');
});
// Error Handling Middleware
app.use(errorHandler_1.errorHandler);
exports.default = app;
