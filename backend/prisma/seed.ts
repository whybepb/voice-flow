import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with test data...\n');

    // ── Clean existing data ─────────────────────────────────────
    await prisma.callLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    console.log('  ✓ Cleaned existing data');

    // ── Create Admin User ───────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            email: 'admin@voiceflow.ai',
            password: '$2a$10$dummyhashforseeding1234567890', // placeholder
            role: 'ADMIN',
        },
    });
    console.log(`  ✓ Admin user: ${admin.email}`);

    // ── Create Customers ────────────────────────────────────────
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                name: 'Alice Johnson',
                email: 'alice@example.com',
                phone: '+15551001001',
                userId: admin.id,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Bob Smith',
                email: 'bob@example.com',
                phone: '+15551001002',
                userId: admin.id,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Charlie Davis',
                email: 'charlie@example.com',
                phone: '+15551001003',
                userId: admin.id,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Diana Martinez',
                email: 'diana@example.com',
                phone: '+15551001004',
                userId: admin.id,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Ethan Brown',
                email: 'ethan@example.com',
                phone: '+15551001005',
                userId: admin.id,
            },
        }),
    ]);
    console.log(`  ✓ Created ${customers.length} customers`);

    // ── Create Campaign ─────────────────────────────────────────
    const campaign = await prisma.campaign.create({
        data: {
            name: 'February Appointment Confirmations',
            type: 'Confirmation',
            status: 'COMPLETED',
            scheduledAt: new Date('2026-02-20T09:00:00Z'),
            userId: admin.id,
        },
    });

    const campaign2 = await prisma.campaign.create({
        data: {
            name: 'Reminder Batch — Week 9',
            type: 'Reminder',
            status: 'DRAFT',
            userId: admin.id,
        },
    });
    console.log(`  ✓ Created 2 campaigns`);

    // ── Create Bookings with Call Logs ───────────────────────────
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Alice — confirmed via AI call, has transcript
    const booking1 = await prisma.booking.create({
        data: {
            customerId: customers[0].id,
            campaignId: campaign.id,
            appointmentTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
            service: 'Dental Cleaning',
            status: 'CONFIRMED',
            lastCallStatus: 'completed',
            userId: admin.id,
            callLogs: {
                create: {
                    sid: 'CA_DEMO_001',
                    callStatus: 'completed',
                    duration: 47,
                    userId: admin.id,
                    transcript:
                        'Assistant: Hi! This is your appointment reminder from the clinic. How can I help you today?\n' +
                        'Caller: Hi, I just wanted to confirm my dental cleaning appointment for tomorrow.\n' +
                        'Assistant: Of course! I can see your appointment is scheduled for tomorrow at 10:00 AM for a Dental Cleaning. Can I confirm that for you?\n' +
                        'Caller: Yes, that works perfectly. Please confirm it.\n' +
                        'Assistant: Great, your appointment is now confirmed! You\'re all set for tomorrow at 10 AM. Is there anything else I can help with?\n' +
                        'Caller: No, that\'s all. Thank you!\n' +
                        'Assistant: You\'re welcome! Have a great day. Goodbye!',
                },
            },
        },
    });

    // Bob — rescheduled via AI call, has transcript
    const booking2 = await prisma.booking.create({
        data: {
            customerId: customers[1].id,
            campaignId: campaign.id,
            appointmentTime: new Date(dayAfter.setHours(14, 30, 0, 0)),
            service: 'Teeth Whitening',
            status: 'RESCHEDULED',
            lastCallStatus: 'completed',
            userId: admin.id,
            callLogs: {
                create: {
                    sid: 'CA_DEMO_002',
                    callStatus: 'completed',
                    duration: 83,
                    userId: admin.id,
                    transcript:
                        'Assistant: Hello! This is the dental office calling about your upcoming appointment. How can I assist you?\n' +
                        'Caller: Hi, I need to reschedule my whitening appointment. The original time doesn\'t work for me anymore.\n' +
                        'Assistant: No problem! Your current appointment is set for Thursday at 2:30 PM. When would you like to reschedule it to?\n' +
                        'Caller: Can you move it to Friday at 4 PM?\n' +
                        'Assistant: Let me check that for you... I\'ve rescheduled your Teeth Whitening appointment to Friday at 4:00 PM. Does that work?\n' +
                        'Caller: Perfect, thanks so much!\n' +
                        'Assistant: You\'re welcome! We\'ll see you Friday at 4 PM. Have a great day!',
                },
            },
        },
    });

    // Charlie — no answer
    const booking3 = await prisma.booking.create({
        data: {
            customerId: customers[2].id,
            campaignId: campaign.id,
            appointmentTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
            service: 'Root Canal',
            status: 'PENDING',
            lastCallStatus: 'no-answer',
            userId: admin.id,
            callLogs: {
                create: {
                    sid: 'CA_DEMO_003',
                    callStatus: 'no-answer',
                    duration: 0,
                    userId: admin.id,
                },
            },
        },
    });

    // Diana — pending, not yet called
    const booking4 = await prisma.booking.create({
        data: {
            customerId: customers[3].id,
            appointmentTime: new Date(dayAfter.setHours(9, 0, 0, 0)),
            service: 'Consultation',
            status: 'PENDING',
            userId: admin.id,
        },
    });

    // Ethan — cancelled via AI call
    const booking5 = await prisma.booking.create({
        data: {
            customerId: customers[4].id,
            campaignId: campaign.id,
            appointmentTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
            service: 'Check-up',
            status: 'CANCELLED',
            lastCallStatus: 'completed',
            userId: admin.id,
            callLogs: {
                create: {
                    sid: 'CA_DEMO_004',
                    callStatus: 'completed',
                    duration: 35,
                    userId: admin.id,
                    transcript:
                        'Assistant: Hi there! I\'m calling about your upcoming check-up appointment. How can I help?\n' +
                        'Caller: Hi, I actually need to cancel that appointment.\n' +
                        'Assistant: I understand. Your check-up is scheduled for tomorrow at 3:00 PM. Are you sure you\'d like to cancel it?\n' +
                        'Caller: Yes, please cancel it.\n' +
                        'Assistant: Done! Your appointment has been cancelled. Would you like to book a new one for a different time?\n' +
                        'Caller: Not right now, but I\'ll call back when I\'m ready.\n' +
                        'Assistant: No problem at all! Feel free to call us anytime. Take care!',
                },
            },
        },
    });

    console.log(`  ✓ Created 5 bookings with call logs and transcripts\n`);

    console.log('─────────────────────────────────────────');
    console.log('🎉 Seeding complete! Summary:');
    console.log(`   • 1 admin user`);
    console.log(`   • ${customers.length} customers`);
    console.log(`   • 2 campaigns`);
    console.log(`   • 5 bookings (3 with AI call transcripts)`);
    console.log('─────────────────────────────────────────\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
