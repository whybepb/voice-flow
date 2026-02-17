import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create Customers
    const cust1 = await prisma.customer.create({
        data: {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phone: '+15550101',
            bookings: {
                create: [
                    {
                        appointmentTime: new Date(new Date().setHours(10, 0, 0, 0)), // Today 10 AM
                        status: 'CONFIRMED',
                        service: 'Dental Cleaning',
                    },
                    {
                        appointmentTime: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
                        status: 'PENDING',
                        service: 'Checkup',
                    },
                ],
            },
        },
    });

    const cust2 = await prisma.customer.create({
        data: {
            name: 'Bob Smith',
            email: 'bob@example.com',
            phone: '+15550102',
            bookings: {
                create: [
                    {
                        appointmentTime: new Date(new Date().setHours(14, 30, 0, 0)), // Today 2:30 PM
                        status: 'CONFIRMED',
                        service: 'Whitening',
                    }
                ]
            },
        },
    });

    const cust3 = await prisma.customer.create({
        data: {
            name: 'Charlie Davis',
            email: 'charlie@example.com',
            phone: '+15550103',
        }
    });

    console.log({ cust1, cust2, cust3 });
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
