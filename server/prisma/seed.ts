import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed Lab 3 Auth Users
  const users = [
    {
      email: 'admin@toktickit.local',
      fullName: 'System Administrator',
      role: 'ADMINISTRATOR',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      email: 'staff@toktickit.local',
      fullName: 'IT Staff Support',
      role: 'IT_STAFF',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      email: 'requester@toktickit.local',
      fullName: 'Alice Requester',
      role: 'REQUESTER',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.passwordHash, role: u.role, isActive: u.isActive },
      create: u,
    });
  }

  // 2. Clear and re-seed Categories in the exact test order
  await prisma.category.deleteMany({});
  const categories = ['Account and Access', 'Hardware', 'Software', 'Network'];
  for (const name of categories) {
    await prisma.category.create({
      data: { name },
    });
  }

  // 3. Seed Lab 2 RequesterUsers
  const requesterUsers = [
    { email: 'alice@toktickit.local', fullName: 'Alice Smith', isActive: true },
    { email: 'bob@toktickit.local', fullName: 'Bob Jones', isActive: true },
  ];

  for (const ru of requesterUsers) {
    await prisma.requesterUser.upsert({
      where: { email: ru.email },
      update: { fullName: ru.fullName, isActive: ru.isActive },
      create: ru,
    });
  }

  // 4. Seed Related Systems
  const systems = ['Email System', 'VPN Gateway', 'HR Portal', 'Finance ERP'];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seeded database with clean categories and users.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
