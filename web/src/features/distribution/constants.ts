/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import type { StatusBadgeProps } from '@/components/status-badge'

// ============================================================================
// Distribution Ledger Type Configuration
// ============================================================================

export const LEDGER_TYPE = {
  EARN: 1,
  REFUND: 2,
  DEDUCT: 3,
} as const

export const LEDGER_TYPES: Record<
  number,
  Pick<StatusBadgeProps, 'variant'> & { labelKey: string; value: number }
> = {
  [LEDGER_TYPE.EARN]: {
    labelKey: 'Commission',
    variant: 'success',
    value: LEDGER_TYPE.EARN,
  },
  [LEDGER_TYPE.REFUND]: {
    labelKey: 'Refund',
    variant: 'warning',
    value: LEDGER_TYPE.REFUND,
  },
  [LEDGER_TYPE.DEDUCT]: {
    labelKey: 'Manual Deduction',
    variant: 'neutral',
    value: LEDGER_TYPE.DEDUCT,
  },
} as const

// ============================================================================
// Validation Constants
// ============================================================================

export const COMMISSION_RATE_MIN = 0
export const COMMISSION_RATE_MAX = 100
export const GROUP_NAME_MAX_LENGTH = 64
export const GROUP_DESCRIPTION_MAX_LENGTH = 255

// ============================================================================
// Success Messages (i18n keys; use t(SUCCESS_MESSAGES.xxx) when displaying)
// ============================================================================

export const SUCCESS_MESSAGES = {
  GROUP_CREATED: 'Distribution group created successfully',
  GROUP_UPDATED: 'Distribution group updated successfully',
  GROUP_DELETED: 'Distribution group deleted successfully',
  GROUP_ASSIGNED: 'Distribution group assigned successfully',
  USER_FROZEN: 'Distribution user frozen successfully',
  USER_UNFROZEN: 'Distribution user unfrozen successfully',
  COMMISSION_DEDUCTED: 'Distribution commission deducted successfully',
  ALL_COMMISSION_DEDUCTED: 'All distribution commissions deducted successfully',
} as const

// ============================================================================
// Error Messages (i18n keys; use t(ERROR_MESSAGES.xxx) when displaying)
// ============================================================================

export const ERROR_MESSAGES = {
  LOAD_GROUPS_FAILED: 'Failed to load distribution groups',
  LOAD_LEDGERS_FAILED: 'Failed to load distribution ledgers',
  LOAD_USERS_FAILED: 'Failed to load distribution users',
  LOAD_MEMBERS_FAILED: 'Failed to load group members',
  CREATE_GROUP_FAILED: 'Failed to create distribution group',
  UPDATE_GROUP_FAILED: 'Failed to update distribution group',
  DELETE_GROUP_FAILED: 'Failed to delete distribution group',
  ASSIGN_GROUP_FAILED: 'Failed to assign distribution group',
  FREEZE_FAILED: 'Failed to update distribution freeze status',
  DEDUCT_FAILED: 'Failed to deduct distribution commission',
  DEDUCT_ALL_FAILED: 'Failed to deduct all distribution commissions',
} as const
