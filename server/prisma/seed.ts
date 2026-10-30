import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed Lab 3 Auth Users (idempotent)
  const users = [
    { email: 'admin@toktickit.local', fullName: 'System Administrator', role: 'ADMINISTRATOR' },
    { email: 'staff@toktickit.local', fullName: 'IT Staff Support', role: 'IT_STAFF' },
    { email: 'requester@toktickit.local', fullName: 'Alice Requester', role: 'REQUESTER' },
  ];

  const userByEmail: Record<string, any> = {};
  for (const u of users) {
    const saved = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, isActive: true },
      create: { ...u, passwordHash, isActive: true, mustChangePassword: false },
    });
    userByEmail[u.email] = saved;
  }

  // 2. Categories (idempotent — upsert, never delete, so Tickets keep valid FKs)
  const categories = ['Account and Access', 'Hardware', 'Software', 'Network'];
  const categoryByName: Record<string, any> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryByName[name] = cat;
  }

  // 3. RequesterUsers (Lab 2 legacy, idempotent)
  const requesterUsers = [
    { email: 'alice@toktickit.local', fullName: 'Alice Smith' },
    { email: 'bob@toktickit.local', fullName: 'Bob Jones' },
  ];
  const requesterByEmail: Record<string, any> = {};
  for (const ru of requesterUsers) {
    const saved = await prisma.requesterUser.upsert({
      where: { email: ru.email },
      update: { fullName: ru.fullName, isActive: true },
      create: { ...ru, isActive: true },
    });
    requesterByEmail[ru.email] = saved;
  }

  // 4. Related Systems (idempotent)
  const systems = ['Email System', 'VPN Gateway', 'HR Portal', 'Finance ERP'];
  const systemByName: Record<string, any> = {};
  for (const name of systems) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    systemByName[name] = sys;
  }

  // 5. Tickets covering all statuses, assigned + unassigned, for dashboard + action demo
  const requesterUserId = userByEmail['requester@toktickit.local'].id;
  const staffUserId = userByEmail['staff@toktickit.local'].id;
  const aliceRequesterId = requesterByEmail['alice@toktickit.local'].id;

  const tickets: Array<{
    ticketNumber: string;
    summary: string;
    description: string;
    requestedPriority: string;
    itPriority: string | null;
    currentStatus: string;
    assignedStaffId: string | null;
    categoryName: string;
    systemName: string;
  }> = [
    { ticketNumber: 'TKT-SEED-001', summary: 'Cannot log in to VPN', description: 'VPN rejects my credentials since Monday.', requestedPriority: 'High', itPriority: 'High', currentStatus: 'New', assignedStaffId: null, categoryName: 'Account and Access', systemName: 'VPN Gateway' },
    { ticketNumber: 'TKT-SEED-002', summary: 'Laptop battery drains fast', description: 'Battery lasts under an hour after update.', requestedPriority: 'Medium', itPriority: 'Medium', currentStatus: 'Open', assignedStaffId: staffUserId, categoryName: 'Hardware', systemName: 'Email System' },
    { ticketNumber: 'TKT-SEED-003', summary: 'Printer driver missing', description: 'Finance printer driver not found on Windows.', requestedPriority: 'Low', itPriority: 'Low', currentStatus: 'In Progress', assignedStaffId: staffUserId, categoryName: 'Hardware', systemName: 'Finance ERP' },
    { ticketNumber: 'TKT-SEED-004', summary: 'Need more detail on request', description: 'Waiting for requester to confirm scope.', requestedPriority: 'Medium', itPriority: null, currentStatus: 'Waiting for Requester', assignedStaffId: staffUserId, categoryName: 'Software', systemName: 'HR Portal' },
    { ticketNumber: 'TKT-SEED-005', summary: 'Email quota increased', description: 'Quota raised to 10GB as requested.', requestedPriority: 'Medium', itPriority: 'Medium', currentStatus: 'Resolved', assignedStaffId: staffUserId, categoryName: 'Account and Access', systemName: 'Email System' },
    { ticketNumber: 'TKT-SEED-006', summary: 'Onboarding completed', description: 'New hire account provisioned and verified.', requestedPriority: 'High', itPriority: 'High', currentStatus: 'Closed', assignedStaffId: staffUserId, categoryName: 'Account and Access', systemName: 'HR Portal' },
    { ticketNumber: 'TKT-SEED-007', summary: 'VPN issue returned', description: 'Same VPN error reappeared after fix.', requestedPriority: 'High', itPriority: 'High', currentStatus: 'Reopened', assignedStaffId: staffUserId, categoryName: 'Account and Access', systemName: 'VPN Gateway' },
    { ticketNumber: 'TKT-SEED-008', summary: 'Duplicate request', description: 'Requested twice by mistake.', requestedPriority: 'Low', itPriority: null, currentStatus: 'Cancelled', assignedStaffId: null, categoryName: 'Network', systemName: 'VPN Gateway' },
    { ticketNumber: 'TKT-SEED-009', summary: 'Wi-Fi drops in meeting room', description: 'Intermittent drops during calls.', requestedPriority: 'High', itPriority: null, currentStatus: 'Open', assignedStaffId: null, categoryName: 'Network', systemName: 'Email System' },
  ];

  const actionSpecs: Record<string, Array<{ description: string; result?: string; followUpRequired?: boolean; followUpNote?: string; attachmentNotes?: string }>> = {
    'TKT-SEED-002': [
      { description: 'Ran battery diagnostic', result: 'Battery health 82%', followUpRequired: true, followUpNote: 'Order replacement if health drops below 80%', attachmentNotes: 'See battery-report.pdf' },
      { description: 'Applied power settings patch', result: 'Idle drain reduced' },
    ],
    'TKT-SEED-003': [
      { description: 'Installed printer driver from vendor site', result: 'Printer detected', attachmentNotes: 'Look for driver-v2.1.exe' },
    ],
    'TKT-SEED-005': [
      { description: 'Increased mailbox quota', result: 'Quota now 10GB', followUpRequired: true, followUpNote: 'Monitor usage for a week' },
      { description: 'Notified requester', result: 'Confirmed working' },
    ],
    'TKT-SEED-006': [
      { description: 'Provisioned account', result: 'Account active', followUpRequired: true, followUpNote: 'Confirm first login' },
    ],
  };

  for (const t of tickets) {
    const saved = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        assignedStaffId: t.assignedStaffId,
      },
      create: {
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        requesterId: aliceRequesterId,
        requesterUserId,
        assignedStaffId: t.assignedStaffId,
        categoryId: categoryByName[t.categoryName].id,
        relatedSystemId: systemByName[t.systemName].id,
      },
    });

    // Idempotent action seeding: reset this ticket's actions to the deterministic set.
    const specs = actionSpecs[t.ticketNumber] || [];
    await prisma.actionTaken.deleteMany({ where: { ticketId: saved.id } });
    for (const s of specs) {
      await prisma.actionTaken.create({
        data: {
          ticketId: saved.id,
          description: s.description,
          result: s.result || null,
          performedByUserId: staffUserId,
          followUpRequired: Boolean(s.followUpRequired),
          followUpNote: s.followUpNote || null,
          attachmentNotes: s.attachmentNotes || null,
        },
      });
    }
  }

  console.log('Seeded database with users, categories, tickets, and actions taken.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
