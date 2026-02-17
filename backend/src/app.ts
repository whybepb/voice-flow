import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customers.routes';
import bookingRoutes from './routes/bookings.routes';
import campaignRoutes from './routes/campaign.routes';

import webhookRoutes from './routes/webhooks.routes';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio sends form-urlencoded
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/bookings', bookingRoutes);
app.use('/campaign', campaignRoutes);
app.use('/webhooks', webhookRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
