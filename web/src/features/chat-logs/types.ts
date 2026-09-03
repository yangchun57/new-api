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
import { z } from 'zod'

export const chatLogSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  token_name: z.string(),
  model_name: z.string(),
  channel_id: z.number(),
  group: z.string(),
  request_id: z.string(),
  upstream_request_id: z.string(),
  conversation_id: z.string(),
  seq: z.number(),
  role: z.string(),
  content: z.string(),
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  quota: z.number(),
  is_stream: z.boolean(),
  status: z.number(),
  latency_ms: z.number(),
  ip: z.string(),
  created_at: z.number(),
})

export type ChatLog = z.infer<typeof chatLogSchema>

export interface GetChatLogsParams {
  p?: number
  page_size?: number
  user_id?: number
  model_name?: string
  token_name?: string
  role?: string
  conversation_id?: string
  request_id?: string
  keyword?: string
  start_timestamp?: number
  end_timestamp?: number
}

export interface GetChatLogsResponse {
  success: boolean
  message?: string
  data?: {
    items: ChatLog[]
    total: number
    page: number
    page_size: number
  }
}
