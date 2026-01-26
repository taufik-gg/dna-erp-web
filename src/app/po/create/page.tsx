'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, getAllThresholds, getRoleDisplayName } from '@/lib/rules'

export default function CreatePOPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const thresholds = getAllThresholds()

  const numericAmount = parseFloat(amount) || 0
  const requiredThreshold = thresholds.find(
    (t) => t.maxAmount === null || numericAmount < t.maxAmount
  ) || thresholds[thresholds.length - 1]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount') as string),
      vendor: formData.get('vendor'),
      createdById: formData.get('createdById'),
    }

    try {
      const res = await fetch('/api/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create PO')
      }

      const po = await res.json()
      router.push(`/po/${po.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Purchase Order</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Office Supplies Q1 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (IDR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5000000"
            />
            {numericAmount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(numericAmount)} - Requires{' '}
                <span className="font-medium text-blue-600">
                  {getRoleDisplayName(requiredThreshold.role)}
                </span>{' '}
                approval
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the purchase..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input
              type="text"
              name="vendor"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., PT Supplier ABC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created By <span className="text-red-500">*</span>
            </label>
            <select
              name="createdById"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select user...</option>
              <option value="staff">John Staff (Staff)</option>
              <option value="manager">Jane Manager (Manager)</option>
              <option value="director">Bob Director (Director)</option>
              <option value="ceo">Alice CEO (CEO)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Demo mode: Select a user to create PO as</p>
          </div>
        </div>

        {/* Approval Threshold Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Approval Thresholds (DNA-Driven)</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {thresholds.map((t) => (
              <div key={t.level} className="flex justify-between">
                <span>
                  {formatCurrency(t.minAmount)} - {t.maxAmount ? formatCurrency(t.maxAmount) : '∞'}
                </span>
                <span className="font-medium">{getRoleDisplayName(t.role)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create PO'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
