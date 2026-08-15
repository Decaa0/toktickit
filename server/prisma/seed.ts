import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

async function main() {
  console.log("Seeding categories...");
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Categories seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });