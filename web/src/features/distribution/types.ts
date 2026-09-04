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

// ============================================================================
// Distribution Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

/** Paginated response envelope returned by the backend PageInfo. */
export interface PageInfo<T> {
  page: number
  page_size: number
  total: number
  items: T[]
}

/** 分销分组 */
export interface DistributionGroup {
  id: number
  name: string
  commission_rate: number
  is_default: boolean
  description?: string
  member_count: number
  created_time: number
  updated_time: number
}

/** 分销用户列表项 */
export interface DistributionUserItem {
  id: number
  username: string
  display_name: string
  email: string
  role: number
  status: number
  distribution_group_id: number
  distribution_frozen: boolean
  distribution_debt: number
  group_name: string
  commission_rate: number
  inviter_id: number
  inviter_name: string
  aff_count: number
  created_at: number
}

/** 当前用户邀请的账号列表项 */
export interface InvitedUserItem {
  id: number
  username: string
  display_name: string
  email: string
  status: number
  used_quota: number
  created_at: number
}

/** 分销提成台账条目 */
export interface DistributionLedger {
  id: number
  user_id: number
  invitee_id: number
  top_up_id: number
  trade_no: string
  type: number
  amount: number
  consumed_quota: number
  settle_date: string
  debt_applied: number
  credited: number
  remark?: string
  created_time: number
}

export interface GetLedgersParams {
  p?: number
  page_size?: number
  user_id?: number
}

export interface GroupFormData {
  id?: number
  name: string
  commission_rate: number
  is_default: boolean
  description?: string
}

export interface AssignGroupRequest {
  user_id: number
  group_id: number
}

export interface FreezeRequest {
  user_id: number
  frozen: boolean
}

export interface DistributionEnabledRequest {
  user_id: number
  enabled: boolean
}

export interface DeductRequest {
  user_id: number
  amount: number
  remark?: string
}

export interface DeductAllRequest {
  user_id: number
  remark?: string
}
