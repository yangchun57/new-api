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
import type { TFunction } from 'i18next'

import type { StatusBadgeProps } from '@/components/status-badge'

export const CHAT_LOG_STATUS = {
  SUCCESS: 1,
  FAILED: 2,
} as const

export const CHAT_LOG_ROLE_VARIANTS: Record<
  string,
  Pick<StatusBadgeProps, 'variant'>
> = {
  user: { variant: 'blue' },
  assistant: { variant: 'green' },
  system: { variant: 'purple' },
  tool: { variant: 'orange' },
  function: { variant: 'orange' },
}

export function getChatLogRoleVariant(role: string) {
  return CHAT_LOG_ROLE_VARIANTS[role]?.variant ?? 'neutral'
}

export function getChatLogRoleOptions(t: TFunction) {
  return [
    { label: t('User'), value: 'user' },
    { label: t('Assistant'), value: 'assistant' },
    { label: t('System'), value: 'system' },
    { label: t('Tool'), value: 'tool' },
  ]
}

// i18n keys; use t(ERROR_MESSAGES.xxx) when displaying.
export const ERROR_MESSAGES = {
  LOAD_FAILED: 'Failed to load chat logs',
  SEARCH_FAILED: 'Failed to search chat logs',
} as const
