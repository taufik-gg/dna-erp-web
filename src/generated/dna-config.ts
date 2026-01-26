/**
 * DNA Configuration - Auto-generated from DNA Repository
 * DO NOT EDIT MANUALLY - This file is managed by Claude Code
 *
 * Last updated: 2025-01-27
 * Source: dna-repo/workflows/purchase-order.md
 *         dna-repo/rules/approval-thresholds.md
 */

export interface ApprovalThreshold {
  level: number;
  minAmount: number;
  maxAmount: number | null;
  role: 'STAFF' | 'MANAGER' | 'DIRECTOR' | 'CEO';
  slaHours: number;
}

export interface DNAConfig {
  version: string;
  lastUpdated: string;
  workflow: {
    name: string;
    statusFlow: string[];
  };
  approvalThresholds: ApprovalThreshold[];
  settings: {
    selfApproval: boolean;
    allowRevision: boolean;
    modifyAfterApproval: boolean;
    requireCommentOnReject: boolean;
    autoEscalateOnSlaBreach: boolean;
  };
}

export const DNA_CONFIG: DNAConfig = {
  version: "1.0",
  lastUpdated: "2025-01-27",
  workflow: {
    name: "purchase-order-approval",
    statusFlow: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
  },
  approvalThresholds: [
    {
      level: 1,
      minAmount: 0,
      maxAmount: 1000000,
      role: "MANAGER",
      slaHours: 24,
    },
    {
      level: 2,
      minAmount: 1000000,
      maxAmount: 10000000,
      role: "DIRECTOR",
      slaHours: 48,
    },
    {
      level: 3,
      minAmount: 10000000,
      maxAmount: null,
      role: "CEO",
      slaHours: 72,
    },
  ],
  settings: {
    selfApproval: false,
    allowRevision: true,
    modifyAfterApproval: false,
    requireCommentOnReject: true,
    autoEscalateOnSlaBreach: true,
  },
};
