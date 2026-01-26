/**
 * DNA Configuration - Auto-generated from DNA Repository
 * DO NOT EDIT MANUALLY - This file is managed by Claude Code
 *
 * Last updated: 2026-01-26
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
  version: "1.2",
  lastUpdated: "2026-01-26",
  workflow: {
    name: "purchase-order-approval",
    statusFlow: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
  },
  approvalThresholds: [
    {
        level: 1,
        minAmount: 0,
        maxAmount: 499999,
        role: "MANAGER",
        slaHours: 24
    },
    {
        level: 2,
        minAmount: 500000,
        maxAmount: 4999999,
        role: "DIRECTOR",
        slaHours: 48
    },
    {
        level: 3,
        minAmount: 5000000,
        maxAmount: null,
        role: "CEO",
        slaHours: 72
    }
],
  settings: {
    selfApproval: false,
    allowRevision: true,
    modifyAfterApproval: false,
    requireCommentOnReject: true,
    autoEscalateOnSlaBreach: true,
  },
};
