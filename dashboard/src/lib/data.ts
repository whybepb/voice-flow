// ── Mock Data for AI Booking Automation Dashboard ──

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'Rescheduled';
export type CallStatus = 'Successful' | 'Failed' | 'No Answer' | 'Voicemail' | 'Pending';

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  appointmentTime: string;
  status: BookingStatus;
  callStatus: CallStatus;
  service: string;
}

export interface Campaign {
  id: string;
  name: string;
  date: string;
  type: 'Confirmation' | 'Reminder' | 'Follow-up' | 'Rescheduling';
  totalCalls: number;
  successful: number;
  failed: number;
  pending: number;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Failed';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastBooking: string;
  status: 'Active' | 'Inactive';
}

export interface DashboardStats {
  totalBookingsToday: number;
  confirmed: number;
  pending: number;
  rescheduled: number;
  failedCalls: number;
  totalCustomers: number;
  confirmationRate: number;
}

export interface AnalyticsPoint {
  month: string;
  confirmationRate: number;
  cancellationRate: number;
  rescheduleRate: number;
  callSuccessRate: number;
}

// ── Bookings ──
export const bookings: Booking[] = [
  { id: 'BK001', name: 'Sarah Johnson', phone: '+1 (555) 234-5678', email: 'sarah.j@email.com', appointmentTime: '2026-02-17 09:00 AM', status: 'Confirmed', callStatus: 'Successful', service: 'Dental Cleaning' },
  { id: 'BK002', name: 'Michael Chen', phone: '+1 (555) 345-6789', email: 'mchen@email.com', appointmentTime: '2026-02-17 10:30 AM', status: 'Pending', callStatus: 'No Answer', service: 'Consultation' },
  { id: 'BK003', name: 'Emily Davis', phone: '+1 (555) 456-7890', email: 'edavis@email.com', appointmentTime: '2026-02-17 11:00 AM', status: 'Confirmed', callStatus: 'Successful', service: 'Root Canal' },
  { id: 'BK004', name: 'James Wilson', phone: '+1 (555) 567-8901', email: 'jwilson@email.com', appointmentTime: '2026-02-17 01:00 PM', status: 'Cancelled', callStatus: 'Successful', service: 'Teeth Whitening' },
  { id: 'BK005', name: 'Maria Garcia', phone: '+1 (555) 678-9012', email: 'mgarcia@email.com', appointmentTime: '2026-02-17 02:00 PM', status: 'Rescheduled', callStatus: 'Successful', service: 'Check-up' },
  { id: 'BK006', name: 'Robert Brown', phone: '+1 (555) 789-0123', email: 'rbrown@email.com', appointmentTime: '2026-02-17 02:30 PM', status: 'Pending', callStatus: 'Voicemail', service: 'Orthodontics' },
  { id: 'BK007', name: 'Lisa Anderson', phone: '+1 (555) 890-1234', email: 'landerson@email.com', appointmentTime: '2026-02-17 03:00 PM', status: 'Confirmed', callStatus: 'Successful', service: 'Dental Cleaning' },
  { id: 'BK008', name: 'David Martinez', phone: '+1 (555) 901-2345', email: 'dmartinez@email.com', appointmentTime: '2026-02-17 03:30 PM', status: 'Pending', callStatus: 'Pending', service: 'Consultation' },
  { id: 'BK009', name: 'Jennifer Taylor', phone: '+1 (555) 012-3456', email: 'jtaylor@email.com', appointmentTime: '2026-02-17 04:00 PM', status: 'Confirmed', callStatus: 'Successful', service: 'Filling' },
  { id: 'BK010', name: 'Christopher Lee', phone: '+1 (555) 123-4567', email: 'clee@email.com', appointmentTime: '2026-02-17 04:30 PM', status: 'Cancelled', callStatus: 'Failed', service: 'Extraction' },
  { id: 'BK011', name: 'Amanda White', phone: '+1 (555) 234-5679', email: 'awhite@email.com', appointmentTime: '2026-02-18 09:00 AM', status: 'Pending', callStatus: 'No Answer', service: 'Dental Cleaning' },
  { id: 'BK012', name: 'Daniel Harris', phone: '+1 (555) 345-6780', email: 'dharris@email.com', appointmentTime: '2026-02-18 09:30 AM', status: 'Confirmed', callStatus: 'Successful', service: 'Crown' },
  { id: 'BK013', name: 'Jessica Clark', phone: '+1 (555) 456-7891', email: 'jclark@email.com', appointmentTime: '2026-02-18 10:00 AM', status: 'Rescheduled', callStatus: 'Successful', service: 'Bridge' },
  { id: 'BK014', name: 'Andrew Lewis', phone: '+1 (555) 567-8902', email: 'alewis@email.com', appointmentTime: '2026-02-18 11:00 AM', status: 'Confirmed', callStatus: 'Successful', service: 'Consultation' },
  { id: 'BK015', name: 'Rachel Walker', phone: '+1 (555) 678-9013', email: 'rwalker@email.com', appointmentTime: '2026-02-18 01:00 PM', status: 'Pending', callStatus: 'Pending', service: 'Teeth Whitening' },
  { id: 'BK016', name: 'Thomas Hall', phone: '+1 (555) 789-0124', email: 'thall@email.com', appointmentTime: '2026-02-18 02:00 PM', status: 'Confirmed', callStatus: 'Successful', service: 'Dental Cleaning' },
  { id: 'BK017', name: 'Nicole Young', phone: '+1 (555) 890-1235', email: 'nyoung@email.com', appointmentTime: '2026-02-18 03:00 PM', status: 'Cancelled', callStatus: 'No Answer', service: 'Extraction' },
  { id: 'BK018', name: 'Kevin King', phone: '+1 (555) 901-2346', email: 'kking@email.com', appointmentTime: '2026-02-18 03:30 PM', status: 'Pending', callStatus: 'Voicemail', service: 'Check-up' },
];

// ── Campaigns ──
export const campaigns: Campaign[] = [
  { id: 'CP001', name: 'Morning Confirmations', date: '2026-02-17', type: 'Confirmation', totalCalls: 45, successful: 38, failed: 4, pending: 3, status: 'Completed' },
  { id: 'CP002', name: 'Afternoon Reminders', date: '2026-02-17', type: 'Reminder', totalCalls: 32, successful: 28, failed: 2, pending: 2, status: 'Completed' },
  { id: 'CP003', name: 'Follow-up Batch', date: '2026-02-16', type: 'Follow-up', totalCalls: 20, successful: 15, failed: 5, pending: 0, status: 'Completed' },
  { id: 'CP004', name: 'Rescheduling Outreach', date: '2026-02-16', type: 'Rescheduling', totalCalls: 12, successful: 9, failed: 1, pending: 2, status: 'Completed' },
  { id: 'CP005', name: 'Evening Confirmations', date: '2026-02-15', type: 'Confirmation', totalCalls: 55, successful: 48, failed: 7, pending: 0, status: 'Completed' },
  { id: 'CP006', name: 'Next-Day Reminders', date: '2026-02-18', type: 'Reminder', totalCalls: 40, successful: 0, failed: 0, pending: 40, status: 'Scheduled' },
  { id: 'CP007', name: 'Weekly Follow-ups', date: '2026-02-17', type: 'Follow-up', totalCalls: 25, successful: 12, failed: 3, pending: 10, status: 'In Progress' },
  { id: 'CP008', name: 'Cancellation Recovery', date: '2026-02-14', type: 'Rescheduling', totalCalls: 18, successful: 11, failed: 7, pending: 0, status: 'Failed' },
];

// ── Customers ──
export const customers: Customer[] = [
  { id: 'CU001', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 234-5678', totalBookings: 12, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU002', name: 'Michael Chen', email: 'mchen@email.com', phone: '+1 (555) 345-6789', totalBookings: 8, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU003', name: 'Emily Davis', email: 'edavis@email.com', phone: '+1 (555) 456-7890', totalBookings: 5, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU004', name: 'James Wilson', email: 'jwilson@email.com', phone: '+1 (555) 567-8901', totalBookings: 3, lastBooking: '2026-02-17', status: 'Inactive' },
  { id: 'CU005', name: 'Maria Garcia', email: 'mgarcia@email.com', phone: '+1 (555) 678-9012', totalBookings: 15, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU006', name: 'Robert Brown', email: 'rbrown@email.com', phone: '+1 (555) 789-0123', totalBookings: 6, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU007', name: 'Lisa Anderson', email: 'landerson@email.com', phone: '+1 (555) 890-1234', totalBookings: 9, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU008', name: 'David Martinez', email: 'dmartinez@email.com', phone: '+1 (555) 901-2345', totalBookings: 2, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU009', name: 'Jennifer Taylor', email: 'jtaylor@email.com', phone: '+1 (555) 012-3456', totalBookings: 7, lastBooking: '2026-02-17', status: 'Active' },
  { id: 'CU010', name: 'Christopher Lee', email: 'clee@email.com', phone: '+1 (555) 123-4567', totalBookings: 4, lastBooking: '2026-02-17', status: 'Inactive' },
];

// ── Dashboard Stats ──
export const dashboardStats: DashboardStats = {
  totalBookingsToday: 18,
  confirmed: 8,
  pending: 5,
  rescheduled: 2,
  failedCalls: 3,
  totalCustomers: 156,
  confirmationRate: 84.5,
};

// ── Analytics Data ──
export const analyticsData: AnalyticsPoint[] = [
  { month: 'Sep', confirmationRate: 78, cancellationRate: 12, rescheduleRate: 8, callSuccessRate: 82 },
  { month: 'Oct', confirmationRate: 82, cancellationRate: 10, rescheduleRate: 7, callSuccessRate: 85 },
  { month: 'Nov', confirmationRate: 79, cancellationRate: 13, rescheduleRate: 9, callSuccessRate: 80 },
  { month: 'Dec', confirmationRate: 85, cancellationRate: 8, rescheduleRate: 6, callSuccessRate: 88 },
  { month: 'Jan', confirmationRate: 88, cancellationRate: 7, rescheduleRate: 5, callSuccessRate: 90 },
  { month: 'Feb', confirmationRate: 84, cancellationRate: 9, rescheduleRate: 6, callSuccessRate: 87 },
];
