import { DNA_CONFIG, ApprovalThreshold } from '@/generated/dna-config'

export type Role = 'STAFF' | 'MANAGER' | 'DIRECTOR' | 'CEO'

const ROLE_HIERARCHY: Record<string, number> = {
  STAFF: 0,
  MANAGER: 1,
  DIRECTOR: 2,
  CEO: 3,
}

/**
 * Get the required approval threshold for a given amount
 */
export function getRequiredThreshold(amount: number): ApprovalThreshold {
  const thresholds = DNA_CONFIG.approvalThresholds.sort((a, b) => a.level - b.level)

  for (const threshold of thresholds) {
    if (threshold.maxAmount === null || amount < threshold.maxAmount) {
      return threshold
    }
  }

  // Return highest threshold if amount exceeds all
  return thresholds[thresholds.length - 1]
}

/**
 * Check if a user with given role can approve a PO with given amount
 */
export function canApprove(userRole: string, amount: number): boolean {
  const requiredThreshold = getRequiredThreshold(amount)
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredThreshold.role] ?? 0

  // User can approve if their level is >= required level
  return userLevel >= requiredLevel
}

/**
 * Check if self-approval is allowed
 */
export function isSelfApprovalAllowed(): boolean {
  return DNA_CONFIG.settings.selfApproval
}

/**
 * Check if revision is allowed for rejected POs
 */
export function isRevisionAllowed(): boolean {
  return DNA_CONFIG.settings.allowRevision
}

/**
 * Check if modification is allowed after approval
 */
export function canModifyAfterApproval(): boolean {
  return DNA_CONFIG.settings.modifyAfterApproval
}

/**
 * Get SLA hours for a given amount
 */
export function getSLAHours(amount: number): number {
  const threshold = getRequiredThreshold(amount)
  return threshold.slaHours
}

/**
 * Format amount to IDR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

/**
 * Get current DNA config version
 */
export function getDNAVersion(): string {
  return DNA_CONFIG.version
}

/**
 * Get last updated date
 */
export function getDNALastUpdated(): string {
  return DNA_CONFIG.lastUpdated
}

/**
 * Get all thresholds for display
 */
export function getAllThresholds(): ApprovalThreshold[] {
  return DNA_CONFIG.approvalThresholds
}
