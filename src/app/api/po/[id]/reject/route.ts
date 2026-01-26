import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canApprove } from '@/lib/rules'
import { DNA_CONFIG } from '@/generated/dna-config'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, comment } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check if comment is required for rejection
    if (DNA_CONFIG.settings.requireCommentOnReject && !comment) {
      return NextResponse.json(
        { error: 'Comment is required when rejecting a PO (per DNA rules)' },
        { status: 400 }
      )
    }

    const [po, user] = await Promise.all([
      prisma.purchaseOrder.findUnique({ where: { id: params.id } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (po.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'Only PENDING_APPROVAL PO can be rejected' },
        { status: 400 }
      )
    }

    // Check if user has sufficient role to reject
    if (!canApprove(user.role, po.amount)) {
      return NextResponse.json(
        {
          error: `User with role ${user.role} cannot reject PO with this amount. Insufficient role level.`,
        },
        { status: 403 }
      )
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        approvedById: userId,
        resolvedAt: new Date(),
      },
    })

    // Create log
    await prisma.approvalLog.create({
      data: {
        poId: params.id,
        userId,
        action: 'Rejected',
        comment,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error rejecting PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
