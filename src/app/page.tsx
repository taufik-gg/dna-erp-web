import { prisma } from '@/lib/db'
import { formatCurrency, getDNAVersion, getDNALastUpdated, getAllThresholds, getRoleDisplayName } from '@/lib/rules'
import Link from 'next/link'

async function getStats() {
  const [total, draft, pending, approved, rejected] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: 'DRAFT' } }),
    prisma.purchaseOrder.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.purchaseOrder.count({ where: { status: 'APPROVED' } }),
    prisma.purchaseOrder.count({ where: { status: 'REJECTED' } }),
  ])
  return { total, draft, pending, approved, rejected }
}

async function getRecentPOs() {
  return prisma.purchaseOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { createdBy: true },
  })
}

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const stats = await getStats()
  const recentPOs = await getRecentPOs()
  const thresholds = getAllThresholds()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          DNA v{getDNAVersion()} | Updated: {getDNALastUpdated()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total PO" value={stats.total} color="gray" />
        <StatCard title="Draft" value={stats.draft} color="slate" />
        <StatCard title="Pending" value={stats.pending} color="yellow" />
        <StatCard title="Approved" value={stats.approved} color="green" />
        <StatCard title="Rejected" value={stats.rejected} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent POs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Purchase Orders</h2>
            <Link href="/po" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          {recentPOs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No purchase orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentPOs.map((po) => (
                <Link
                  key={po.id}
                  href={`/po/${po.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{po.poNumber}</div>
                      <div className="text-sm text-gray-500">{po.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(po.amount)}</div>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Approval Thresholds */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Approval Thresholds (DNA-Driven)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Amount Range</th>
                  <th className="text-left py-2">Required Role</th>
                  <th className="text-left py-2">SLA</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t) => (
                  <tr key={t.level} className="border-b last:border-0">
                    <td className="py-2">
                      {formatCurrency(t.minAmount)} -{' '}
                      {t.maxAmount ? formatCurrency(t.maxAmount) : 'Unlimited'}
                    </td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {getRoleDisplayName(t.role)}
                      </span>
                    </td>
                    <td className="py-2">{t.slaHours} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            These thresholds are automatically synced from the DNA repository.
            Edit the DNA files to change approval rules.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/po/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New PO
          </Link>
          <Link
            href="/po?status=PENDING_APPROVAL"
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Review Pending ({stats.pending})
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    slate: 'bg-slate-100 text-slate-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
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
