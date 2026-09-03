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

import type { GetChatLogsParams, GetChatLogsResponse } from './types'

function buildQueryParams(params: GetChatLogsParams): URLSearchParams {
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(params.p ?? 1))
  queryParams.set('page_size', String(params.page_size ?? 20))

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (key === 'p' || key === 'page_size') return
    queryParams.append(key, String(value))
  })

  return queryParams
}

export async function getAllChatLogs(
  params: GetChatLogsParams = {}
): Promise<GetChatLogsResponse> {
  const res = await api.get(`/api/chat-log/?${buildQueryParams(params)}`)
  return res.data
}

export async function getUserChatLogs(
  params: Omit<GetChatLogsParams, 'user_id'> = {}
): Promise<GetChatLogsResponse> {
  const res = await api.get(`/api/chat-log/self?${buildQueryParams(params)}`)
  return res.data
}
