import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create users with different roles
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'staff@example.com' },
      update: {},
      create: {
        email: 'staff@example.com',
        name: 'John Staff',
        role: 'STAFF',
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        name: 'Jane Manager',
        role: 'MANAGER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'director@example.com' },
      update: {},
      create: {
        email: 'director@example.com',
        name: 'Bob Director',
        role: 'DIRECTOR',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ceo@example.com' },
      update: {},
      create: {
        email: 'ceo@example.com',
        name: 'Alice CEO',
        role: 'CEO',
      },
    }),
  ])

  console.log('Created users:', users.map(u => `${u.name} (${u.role})`))

  // Create sample POs
  const pos = await Promise.all([
    prisma.purchaseOrder.upsert({
      where: { poNumber: 'PO-2025-001' },
      update: {},
      create: {
        poNumber: 'PO-2025-001',
        title: 'Office Supplies',
        description: 'Pens, papers, and stationery',
        amount: 500000,
        vendor: 'PT Supplier Alat Tulis',
        status: 'DRAFT',
        createdById: users[0].id,
      },
    }),
    prisma.purchaseOrder.upsert({
      where: { poNumber: 'PO-2025-002' },
      update: {},
      create: {
        poNumber: 'PO-2025-002',
        title: 'Computer Equipment',
        description: '5 laptops for new employees',
        amount: 75000000,
        vendor: 'PT Tech Solutions',
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        createdById: users[0].id,
      },
    }),
    prisma.purchaseOrder.upsert({
      where: { poNumber: 'PO-2025-003' },
      update: {},
      create: {
        poNumber: 'PO-2025-003',
        title: 'Marketing Materials',
        description: 'Brochures and banners',
        amount: 2500000,
        vendor: 'PT Print Pro',
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 86400000),
        resolvedAt: new Date(),
        createdById: users[0].id,
        approvedById: users[2].id,
      },
    }),
  ])

  console.log('Created POs:', pos.map(p => `${p.poNumber}: ${p.title}`))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
