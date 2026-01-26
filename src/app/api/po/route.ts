import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET all POs
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')

  const where = status ? { status: status as any } : {}

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: true,
      approvedBy: true,
    },
  })

  return NextResponse.json(purchaseOrders)
}

// POST create new PO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, amount, vendor, createdById } = body

    if (!title || !amount || !createdById) {
      return NextResponse.json(
        { error: 'Missing required fields: title, amount, createdById' },
        { status: 400 }
      )
    }

    // Find user by email prefix (demo mode)
    const userEmail = `${createdById}@example.com`
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate PO number
    const count = await prisma.purchaseOrder.count()
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        title,
        description,
        amount: parseFloat(amount),
        vendor,
        status: 'DRAFT',
        createdById: user.id,
      },
      include: {
        createdBy: true,
      },
    })

    // Create log
    await prisma.approvalLog.create({
      data: {
        poId: po.id,
        userId: user.id,
        action: 'Created PO',
      },
    })

    return NextResponse.json(po)
  } catch (error: any) {
    console.error('Error creating PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
