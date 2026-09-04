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
import { api } from '@/lib/api'

import type {
  ApiResponse,
  AssignGroupRequest,
  DeductAllRequest,
  DeductRequest,
  DistributionEnabledRequest,
  DistributionGroup,
  DistributionLedger,
  DistributionUserItem,
  FreezeRequest,
  GetLedgersParams,
  GroupFormData,
  InvitedUserItem,
  PageInfo,
} from './types'

// ============================================================================
// Distribution Group APIs (admin)
// ============================================================================

export async function getDistributionGroups(): Promise<
  ApiResponse<DistributionGroup[]>
> {
  const res = await api.get('/api/distribution_group/')
  return res.data
}

export async function createDistributionGroup(
  data: GroupFormData
): Promise<ApiResponse<DistributionGroup>> {
  const res = await api.post('/api/distribution_group/', data)
  return res.data
}

export async function updateDistributionGroup(
  data: GroupFormData & { id: number }
): Promise<ApiResponse<DistributionGroup>> {
  const res = await api.put('/api/distribution_group/', data)
  return res.data
}

export async function deleteDistributionGroup(
  id: number
): Promise<ApiResponse> {
  const res = await api.delete(`/api/distribution_group/${id}`)
  return res.data
}

/** 当前用户的邀请码（为空时后端会生成）。 */
export async function getSelfAffCode(): Promise<ApiResponse<string>> {
  const res = await api.get('/api/user/aff')
  return res.data
}

// ============================================================================
// Distribution Ledger APIs
// ============================================================================

/** 管理员分页查询分销提成台账；user_id 为空时查询全部。 */
export async function getDistributionLedgers(
  params: GetLedgersParams = {}
): Promise<ApiResponse<PageInfo<DistributionLedger>>> {
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(params.p ?? 1))
  queryParams.set('page_size', String(params.page_size ?? 20))
  if (params.user_id) queryParams.set('user_id', String(params.user_id))
  const res = await api.get(`/api/distribution/ledgers?${queryParams.toString()}`)
  return res.data
}

/** 当前用户分页查询自己的分销提成台账。 */
export async function getSelfDistributionLedgers(
  params: GetLedgersParams = {}
): Promise<ApiResponse<PageInfo<DistributionLedger>>> {
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(params.p ?? 1))
  queryParams.set('page_size', String(params.page_size ?? 20))
  const res = await api.get(
    `/api/user/distribution/ledgers?${queryParams.toString()}`
  )
  return res.data
}

/** 当前用户分页查询自己邀请的账号。 */
export async function getSelfInvitedUsers(
  params: GetLedgersParams = {}
): Promise<ApiResponse<PageInfo<InvitedUserItem>>> {
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(params.p ?? 1))
  queryParams.set('page_size', String(params.page_size ?? 20))
  const res = await api.get(
    `/api/user/distribution/invitees?${queryParams.toString()}`
  )
  return res.data
}

// ============================================================================
// Distribution User Operation APIs (admin)
// ============================================================================

export async function assignDistributionGroup(
  request: AssignGroupRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/distribution/assign_group', request, {
    skipBusinessError: true,
  })
  return res.data
}

export async function setDistributionFrozen(
  request: FreezeRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/distribution/freeze', request, {
    skipBusinessError: true,
  })
  return res.data
}

export async function setDistributionEnabled(
  request: DistributionEnabledRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/distribution/enabled', request, {
    skipBusinessError: true,
  })
  return res.data
}

export async function deductDistributionCommission(
  request: DeductRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/distribution/deduct', request, {
    skipBusinessError: true,
  })
  return res.data
}

export async function deductAllDistributionCommission(
  request: DeductAllRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/distribution/deduct_all', request, {
    skipBusinessError: true,
  })
  return res.data
}

/** 管理员手动触发一次分销消费提成结算，立即处理未结算的下级消耗。 */
export async function triggerDistributionSettlement(): Promise<
  ApiResponse<{ credited: number }>
> {
  const res = await api.post('/api/distribution/settle', undefined, {
    skipBusinessError: true,
  })
  return res.data
}

// ============================================================================
// Distribution User List APIs (admin)
// ============================================================================

export interface GetDistributionUsersParams {
  p?: number
  page_size?: number
  keyword?: string
  group_id?: number
  frozen?: boolean
}

export async function getDistributionUsers(
  params: GetDistributionUsersParams = {}
): Promise<ApiResponse<PageInfo<DistributionUserItem>>> {
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(params.p ?? 1))
  queryParams.set('page_size', String(params.page_size ?? 20))
  if (params.keyword) queryParams.set('keyword', params.keyword)
  if (params.group_id) queryParams.set('group_id', String(params.group_id))
  if (params.frozen !== undefined) queryParams.set('frozen', String(params.frozen))
  const res = await api.get(`/api/distribution/users?${queryParams.toString()}`)
  return res.data
}

export async function getDistributionGroupMembers(
  groupId: number,
  params: { p?: number; page_size?: number } = {}
): Promise<ApiResponse<PageInfo<DistributionUserItem>>> {
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(params.p ?? 1))
  queryParams.set('page_size', String(params.page_size ?? 20))
  const res = await api.get(
    `/api/distribution_group/${groupId}/members?${queryParams.toString()}`
  )
  return res.data
}
