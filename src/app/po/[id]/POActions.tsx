'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { canApprove, isSelfApprovalAllowed, getRoleDisplayName } from '@/lib/rules'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface POActionsProps {
  poId: string
  status: string
  amount: number
  createdById: string
  users: User[]
}

export default function POActions({ poId, status, amount, createdById, users }: POActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [comment, setComment] = useState('')

  const selectedUser = users.find((u) => u.id === selectedUserId)

  // Check if selected user can approve
  const userCanApprove = selectedUser ? canApprove(selectedUser.role, amount) : false
  const isSelfApproval = selectedUserId === createdById
  const selfApprovalAllowed = isSelfApprovalAllowed()

  const canPerformApproval = userCanApprove && (!isSelfApproval || selfApprovalAllowed)

  async function performAction(action: 'submit' | 'approve' | 'reject' | 'revise') {
    if (!selectedUserId && action !== 'submit') {
      setError('Please select a user')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/po/${poId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId || createdById,
          comment,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${action}`)
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'APPROVED') {
    return (
      <div className="text-center py-4 text-green-600">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        This PO has been approved
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {status === 'DRAFT' && (
        <button
          onClick={() => performAction('submit')}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for Approval'}
        </button>
      )}

      {status === 'PENDING_APPROVAL' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Act as User (Demo)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && (
            <>
              {!userCanApprove && (
                <div className="p-3 bg-yellow-100 text-yellow-700 rounded text-sm">
                  {selectedUser?.name} ({getRoleDisplayName(selectedUser?.role!)}) does not have
                  sufficient role to approve this PO amount.
                </div>
              )}

              {userCanApprove && isSelfApproval && !selfApprovalAllowed && (
                <div className="p-3 bg-yellow-100 text-yellow-700 rounded text-sm">
                  Self-approval is not allowed per DNA rules.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Add a comment..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => performAction('approve')}
                  disabled={loading || !canPerformApproval}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => performAction('reject')}
                  disabled={loading || !userCanApprove}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? '...' : 'Reject'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {status === 'REJECTED' && (
        <button
          onClick={() => performAction('revise')}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Revising...' : 'Revise and Resubmit'}
        </button>
      )}
    </div>
  )
}
