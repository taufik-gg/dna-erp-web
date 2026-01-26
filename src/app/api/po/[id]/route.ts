import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET single PO
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      createdBy: true,
      approvedBy: true,
      logs: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!po) {
    return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  }

  return NextResponse.json(po)
}

// PATCH update PO
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, amount, vendor } = body

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    })

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    if (po.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot modify approved PO' },
        { status: 400 }
      )
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(vendor !== undefined && { vendor }),
      },
      include: {
        createdBy: true,
        approvedBy: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE PO
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
  })

  if (!po) {
    return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  }

  if (po.status === 'APPROVED') {
    return NextResponse.json(
      { error: 'Cannot delete approved PO' },
      { status: 400 }
    )
  }

  // Delete logs first
  await prisma.approvalLog.deleteMany({
    where: { poId: params.id },
  })

  await prisma.purchaseOrder.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
