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

  // 2. Seed Related Systems (>= 6)
  const relatedSystems = [
    { name: 'Email', categoryId: 1 },
    { name: 'LEB2 App', categoryId: 3 },
    { name: 'Grade Submission App', categoryId: 3 },
    { name: 'Campus Wi-Fi', categoryId: 4 },
    { name: 'VPN', categoryId: 4 },
    { name: 'Corporate Laptop', categoryId: 2 },
    { name: 'Printer', categoryId: 2 },
  ];

  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sys.name },
      update: {},
      create: sys,
    });
  }

  // 3. Seed Requesters (4 active, 1 inactive)
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
      update: { isActive: req.isActive },
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