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
  sent: number;
  connected: number;
  converted: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastBooking: string;
  status: 'Active' | 'Inactive';
  lastContact: string;
}

export interface DashboardStats {
  appointmentsToday: number;
  confirmedCount: number;
  pendingCount: number;
  rescheduledCount: number;
  failedCalls: number;
  totalCustomers: number;
  confirmationRate: number;
}

export interface AnalyticsData {
  confirmationRate: { month: string; value: number }[];
  cancellationRate: { month: string; value: number }[];
  rescheduleRate: { month: string; value: number }[];
  callSuccessRate: { month: string; value: number }[];
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
];

// ── Campaigns ──
export const campaigns: Campaign[] = [
  { id: 'CP001', name: 'Morning Confirmations', date: '2026-02-17', type: 'Confirmation', totalCalls: 45, successful: 38, failed: 4, pending: 3, status: 'Completed', sent: 45, connected: 42, converted: 38 },
  { id: 'CP002', name: 'Afternoon Reminders', date: '2026-02-17', type: 'Reminder', totalCalls: 32, successful: 28, failed: 2, pending: 2, status: 'Completed', sent: 32, connected: 30, converted: 28 },
  { id: 'CP003', name: 'Follow-up Batch', date: '2026-02-16', type: 'Follow-up', totalCalls: 20, successful: 15, failed: 5, pending: 0, status: 'Completed', sent: 20, connected: 15, converted: 12 },
  { id: 'CP004', name: 'Rescheduling Outreach', date: '2026-02-16', type: 'Rescheduling', totalCalls: 12, successful: 9, failed: 1, pending: 2, status: 'Completed', sent: 12, connected: 10, converted: 9 },
  { id: 'CP005', name: 'Evening Confirmations', date: '2026-02-15', type: 'Confirmation', totalCalls: 55, successful: 48, failed: 7, pending: 0, status: 'Completed', sent: 55, connected: 51, converted: 48 },
];

// ── Customers ──
export const customers: Customer[] = [
  { id: 'CU001', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 234-5678', totalBookings: 12, lastBooking: '2026-02-17', status: 'Active', lastContact: '2 hours ago' },
  { id: 'CU002', name: 'Michael Chen', email: 'mchen@email.com', phone: '+1 (555) 345-6789', totalBookings: 8, lastBooking: '2026-02-17', status: 'Active', lastContact: '1 day ago' },
  { id: 'CU003', name: 'Emily Davis', email: 'edavis@email.com', phone: '+1 (555) 456-7890', totalBookings: 5, lastBooking: '2026-02-17', status: 'Active', lastContact: '3 days ago' },
  { id: 'CU004', name: 'James Wilson', email: 'jwilson@email.com', phone: '+1 (555) 567-8901', totalBookings: 3, lastBooking: '2026-02-17', status: 'Inactive', lastContact: '1 month ago' },
  { id: 'CU005', name: 'Maria Garcia', email: 'mgarcia@email.com', phone: '+1 (555) 678-9012', totalBookings: 15, lastBooking: '2026-02-17', status: 'Active', lastContact: '5 hours ago' },
];

// ── Dashboard Stats ──
export const stats: DashboardStats = {
  appointmentsToday: 18,
  confirmedCount: 8,
  pendingCount: 5,
  rescheduledCount: 2,
  failedCalls: 3,
  totalCustomers: 156,
  confirmationRate: 84.5,
};

// ── Analytics Data ──
export const analytics: AnalyticsData = {
  confirmationRate: [
    { month: 'Sep', value: 78 }, { month: 'Oct', value: 82 }, { month: 'Nov', value: 79 },
    { month: 'Dec', value: 85 }, { month: 'Jan', value: 89 }, { month: 'Feb', value: 84 },
  ],
  cancellationRate: [
    { month: 'Sep', value: 12 }, { month: 'Oct', value: 10 }, { month: 'Nov', value: 13 },
    { month: 'Dec', value: 8 }, { month: 'Jan', value: 7 }, { month: 'Feb', value: 9 },
  ],
  rescheduleRate: [
    { month: 'Sep', value: 8 }, { month: 'Oct', value: 7 }, { month: 'Nov', value: 9 },
    { month: 'Dec', value: 6 }, { month: 'Jan', value: 5 }, { month: 'Feb', value: 6 },
  ],
  callSuccessRate: [
    { month: 'Sep', value: 82 }, { month: 'Oct', value: 85 }, { month: 'Nov', value: 80 },
    { month: 'Dec', value: 88 }, { month: 'Jan', value: 90 }, { month: 'Feb', value: 87 },
  ],
};
