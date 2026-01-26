import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isRevisionAllowed } from '@/lib/rules'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, comment } = body

    // Check if revision is allowed per DNA rules
    if (!isRevisionAllowed()) {
      return NextResponse.json(
        { error: 'Revision is not allowed per DNA rules' },
        { status: 403 }
      )
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    })

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    if (po.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Only REJECTED PO can be revised' },
        { status: 400 }
      )
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'DRAFT',
        approvedById: null,
        resolvedAt: null,
      },
    })

    // Create log
    await prisma.approvalLog.create({
      data: {
        poId: params.id,
        userId: userId || po.createdById,
        action: 'Revised - returned to draft',
        comment,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error revising PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
