import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Lab 2 data...");

  // 1. Seed 4 Categories (Required in Section 5.3)
  const categories = [
    { name: "Account and Access" },
    { name: "Hardware" },
    { name: "Software" },
    { name: "Network" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, isActive: true },
    });
  }

  // 2. Seed >= 6 Related Systems (Required in Section 5.3)
  const relatedSystems = [
    { name: "Email" },
    { name: "Campus Wi-Fi" },
    { name: "VPN" },
    { name: "LEB2 App" },
    { name: "Grade Submission App" },
    { name: "Printer" },
    { name: "Corporate Laptop" },
  ];

  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sys.name },
      update: {},
      create: { name: sys.name, isActive: true },
    });
  }

  // 3. Seed >= 4 Active Requesters + 1 Inactive Requester (Required in Section 5.3)
  const requesters = [
    { name: "Jennifer Anderson", email: "jennifer.anderson@example.com", isActive: true },
    { name: "Michael Brown", email: "michael.brown@example.com", isActive: true },
    { name: "Sarah Johnson", email: "sarah.johnson@example.com", isActive: true },
    { name: "David Lee", email: "david.lee@example.com", isActive: true },
    { name: "Inactive Test User", email: "inactive.user@example.com", isActive: false },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: { isActive: req.isActive, name: req.name },
      create: req,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });