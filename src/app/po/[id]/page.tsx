import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import {
  formatCurrency,
  getRequiredThreshold,
  getRoleDisplayName,
  canApprove,
  isSelfApprovalAllowed,
} from '@/lib/rules'
import { format } from 'date-fns'
import POActions from './POActions'

export const dynamic = 'force-dynamic'

async function getPO(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      createdBy: true,
      approvedBy: true,
      logs: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return po
}

async function getUsers() {
  return prisma.user.findMany()
}

export default async function PODetailPage({ params }: { params: { id: string } }) {
  const po = await getPO(params.id)
  const users = await getUsers()

  if (!po) {
    notFound()
  }

  const threshold = getRequiredThreshold(po.amount)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{po.poNumber}</h1>
          <p className="text-gray-500">{po.title}</p>
        </div>
        <StatusBadge status={po.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Amount</dt>
                <dd className="text-xl font-bold text-blue-600">{formatCurrency(po.amount)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Required Approver</dt>
                <dd>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    {getRoleDisplayName(threshold.role)}+
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Vendor</dt>
                <dd className="font-medium">{po.vendor || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">SLA</dt>
                <dd className="font-medium">{threshold.slaHours} hours</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="mt-1">{po.description || 'No description provided'}</dd>
              </div>
            </dl>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
            <div className="space-y-4">
              <TimelineItem
                action="Created"
                user={po.createdBy.name}
                date={po.createdAt}
              />
              {po.submittedAt && (
                <TimelineItem
                  action="Submitted for approval"
                  user={po.createdBy.name}
                  date={po.submittedAt}
                />
              )}
              {po.logs.map((log) => (
                <TimelineItem
                  key={log.id}
                  action={log.action}
                  user={log.user.name}
                  date={log.createdAt}
                  comment={log.comment}
                />
              ))}
              {po.resolvedAt && po.approvedBy && (
                <TimelineItem
                  action={po.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                  user={po.approvedBy.name}
                  date={po.resolvedAt}
                  highlight={po.status === 'APPROVED' ? 'green' : 'red'}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <POActions
              poId={po.id}
              status={po.status}
              amount={po.amount}
              createdById={po.createdById}
              users={users}
            />
          </div>

          {/* Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Info</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Created By</dt>
                <dd className="font-medium">{po.createdBy.name}</dd>
                <dd className="text-xs text-gray-400">{po.createdBy.role}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd>{format(po.createdAt, 'PPpp')}</dd>
              </div>
              {po.approvedBy && (
                <div>
                  <dt className="text-gray-500">
                    {po.status === 'APPROVED' ? 'Approved' : 'Rejected'} By
                  </dt>
                  <dd className="font-medium">{po.approvedBy.name}</dd>
                  <dd className="text-xs text-gray-400">{po.approvedBy.role}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* DNA Rules */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">DNA Rules Applied</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                Self-approval: {isSelfApprovalAllowed() ? 'Allowed' : 'Not allowed'}
              </li>
              <li>Required role: {getRoleDisplayName(threshold.role)}+</li>
              <li>SLA: {threshold.slaHours} hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }

  return (
    <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

function TimelineItem({
  action,
  user,
  date,
  comment,
  highlight,
}: {
  action: string
  user: string
  date: Date
  comment?: string | null
  highlight?: 'green' | 'red'
}) {
  const dotColor = highlight === 'green' ? 'bg-green-500' : highlight === 'red' ? 'bg-red-500' : 'bg-gray-300'

  return (
    <div className="flex gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${dotColor}`} />
      <div className="flex-1">
        <div className="font-medium">{action}</div>
        <div className="text-sm text-gray-500">
          by {user} • {format(date, 'PPp')}
        </div>
        {comment && <div className="text-sm mt-1 text-gray-600 italic">"{comment}"</div>}
      </div>
    </div>
  )
}
