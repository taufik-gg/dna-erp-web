import { prisma } from '@/lib/db'
import { formatCurrency, getRequiredThreshold, getRoleDisplayName } from '@/lib/rules'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getPurchaseOrders(status?: string) {
  const where = status ? { status: status as any } : {}
  return prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: true,
      approvedBy: true,
    },
  })
}

export default async function POListPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status
  const purchaseOrders = await getPurchaseOrders(status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Link
          href="/po/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New PO
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <FilterTab href="/po" label="All" active={!status} />
        <FilterTab href="/po?status=DRAFT" label="Draft" active={status === 'DRAFT'} />
        <FilterTab
          href="/po?status=PENDING_APPROVAL"
          label="Pending"
          active={status === 'PENDING_APPROVAL'}
        />
        <FilterTab href="/po?status=APPROVED" label="Approved" active={status === 'APPROVED'} />
        <FilterTab href="/po?status=REJECTED" label="Rejected" active={status === 'REJECTED'} />
      </div>

      {/* PO List */}
      {purchaseOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No purchase orders found</p>
          <Link href="/po/create" className="text-blue-600 hover:underline mt-2 inline-block">
            Create your first PO
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">PO Number</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Required Approver
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created By</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchaseOrders.map((po) => {
                const threshold = getRequiredThreshold(po.amount)
                return (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{po.poNumber}</td>
                    <td className="px-4 py-3">{po.title}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(po.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {getRoleDisplayName(threshold.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{po.createdBy.name}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/po/${po.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </Link>
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
    PENDING_APPROVAL: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  )
}
