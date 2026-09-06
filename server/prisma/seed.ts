import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Categories
  const categories = [
    { id: 1, name: 'Account and Access' },
    { id: 2, name: 'Hardware' },
    { id: 3, name: 'Software' },
    { id: 4, name: 'Network' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // 2. Seed Related Systems
  const relatedSystems = [
    { name: 'Email' },
    { name: 'LEB2 App' },
    { name: 'Grade Submission App' },
    { name: 'Campus Wi-Fi' },
    { name: 'VPN' },
    { name: 'Corporate Laptop' },
    { name: 'Printer' },
  ];

  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sys.name },
      update: {},
      create: {
        name: sys.name,
      },
    });
  }

  // 3. Delete old @example.com users to prevent duplicate display
  await prisma.requesterUser.deleteMany({
    where: {
      email: {
        contains: 'example.com',
      },
    },
  });

  // 4. Seed Requesters (4 active, 1 inactive)
  const requesters = [
    { name: 'Jennifer Anderson', email: 'jennifer.anderson@kmutt.ac.th', isActive: true },
    { name: 'David Lee', email: 'david.lee@kmutt.ac.th', isActive: true },
    { name: 'Sarah Johnson', email: 'sarah.johnson@kmutt.ac.th', isActive: true },
    { name: 'Michael Brown', email: 'michael.brown@kmutt.ac.th', isActive: true },
    { name: 'Inactive TestUser', email: 'inactive.user@kmutt.ac.th', isActive: false },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {
        name: req.name,
        isActive: req.isActive,
      },
      create: req,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });