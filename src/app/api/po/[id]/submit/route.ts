import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId } = body

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    })

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    if (po.status !== 'DRAFT' && po.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Only DRAFT or REJECTED PO can be submitted' },
        { status: 400 }
      )
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
      },
    })

    // Create log
    await prisma.approvalLog.create({
      data: {
        poId: params.id,
        userId: userId || po.createdById,
        action: 'Submitted for approval',
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error submitting PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
