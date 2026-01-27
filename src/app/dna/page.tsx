import { DNA_CONFIG } from '@/generated/dna-config'
import { formatCurrency, getRoleDisplayName } from '@/lib/rules'
import Link from 'next/link'

export default function DNAConfigPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DNA Configuration</h1>
          <p className="text-gray-500">
            Business rules automatically synced from DNA Repository
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dna/edit"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 font-medium"
          >
            <span>🤖</span>
            Edit dengan AI
          </Link>
          <div className="text-right">
            <div className="text-sm text-gray-500">Version</div>
            <div className="font-mono text-lg">{DNA_CONFIG.version}</div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">How DNA-Driven Updates Work</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Edit markdown files in the DNA repository</li>
          <li>Commit and push changes to GitHub</li>
          <li>GitHub webhook triggers Claude Code</li>
          <li>Claude Code reads DNA and updates this config file</li>
          <li>ERP automatically applies new rules</li>
        </ol>
      </div>

      {/* Workflow Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Workflow Configuration</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Workflow Name</dt>
            <dd className="font-medium">{DNA_CONFIG.workflow.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Last Updated</dt>
            <dd className="font-medium">{DNA_CONFIG.lastUpdated}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-gray-500 mb-2">Status Flow</dt>
            <dd className="flex items-center gap-2">
              {DNA_CONFIG.workflow.statusFlow.map((status, i) => (
                <span key={status} className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                    {status}
                  </span>
                  {i < DNA_CONFIG.workflow.statusFlow.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      {/* Approval Thresholds */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Approval Thresholds</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Level</th>
                <th className="text-left py-2 px-4">Min Amount</th>
                <th className="text-left py-2 px-4">Max Amount</th>
                <th className="text-left py-2 px-4">Required Role</th>
                <th className="text-left py-2 px-4">SLA</th>
              </tr>
            </thead>
            <tbody>
              {DNA_CONFIG.approvalThresholds.map((threshold) => (
                <tr key={threshold.level} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                      Level {threshold.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {formatCurrency(threshold.minAmount)}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {threshold.maxAmount ? formatCurrency(threshold.maxAmount) : '∞ (Unlimited)'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      {getRoleDisplayName(threshold.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4">{threshold.slaHours} hours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Business Rules Settings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SettingCard
            label="Self Approval"
            value={DNA_CONFIG.settings.selfApproval}
          />
          <SettingCard
            label="Allow Revision"
            value={DNA_CONFIG.settings.allowRevision}
          />
          <SettingCard
            label="Modify After Approval"
            value={DNA_CONFIG.settings.modifyAfterApproval}
          />
          <SettingCard
            label="Require Comment on Reject"
            value={DNA_CONFIG.settings.requireCommentOnReject}
          />
          <SettingCard
            label="Auto Escalate on SLA Breach"
            value={DNA_CONFIG.settings.autoEscalateOnSlaBreach}
          />
        </div>
      </div>

      {/* Raw Config */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Raw Configuration (JSON)</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(DNA_CONFIG, null, 2)}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          Source: <code>src/generated/dna-config.ts</code> (auto-generated by Claude Code)
        </p>
      </div>
    </div>
  )
}

function SettingCard({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="font-medium">{value ? 'Enabled' : 'Disabled'}</span>
      </div>
    </div>
  )
}
