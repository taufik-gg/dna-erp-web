import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canApprove, isSelfApprovalAllowed } from '@/lib/rules'

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
        { error: 'Only PENDING_APPROVAL PO can be approved' },
        { status: 400 }
      )
    }

    // Check if user can approve based on DNA rules
    if (!canApprove(user.role, po.amount)) {
      return NextResponse.json(
        {
          error: `User with role ${user.role} cannot approve PO with amount ${po.amount}. Insufficient role level.`,
        },
        { status: 403 }
      )
    }

    // Check self-approval
    if (po.createdById === userId && !isSelfApprovalAllowed()) {
      return NextResponse.json(
        { error: 'Self-approval is not allowed per DNA rules' },
        { status: 403 }
      )
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        resolvedAt: new Date(),
      },
    })

    // Create log
    await prisma.approvalLog.create({
      data: {
        poId: params.id,
        userId,
        action: 'Approved',
        comment,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error approving PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
