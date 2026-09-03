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
import { z } from 'zod'

import {
  COMMISSION_RATE_MAX,
  COMMISSION_RATE_MIN,
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
} from '../constants'
import type { DistributionGroup, GroupFormData } from '../types'

export function getGroupFormSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .min(1, t('Group name is required'))
      .max(GROUP_NAME_MAX_LENGTH, t('Group name is too long')),
    commission_rate: z
      .number()
      .min(COMMISSION_RATE_MIN, t('Commission rate must be between 0 and 100'))
      .max(COMMISSION_RATE_MAX, t('Commission rate must be between 0 and 100')),
    is_default: z.boolean(),
    description: z.string().max(GROUP_DESCRIPTION_MAX_LENGTH).optional(),
  })
}

export type GroupFormValues = {
  name: string
  commission_rate: number
  is_default: boolean
  description?: string
}

export const GROUP_FORM_DEFAULT_VALUES: GroupFormValues = {
  name: '',
  commission_rate: 0,
  is_default: false,
  description: '',
}

export function transformGroupFormToPayload(data: GroupFormValues): GroupFormData {
  return {
    name: data.name.trim(),
    commission_rate: data.commission_rate,
    is_default: data.is_default,
    description: data.description?.trim() || '',
  }
}

export function transformGroupToFormDefaults(
  group: DistributionGroup
): GroupFormValues {
  return {
    name: group.name,
    commission_rate: group.commission_rate,
    is_default: group.is_default,
    description: group.description ?? '',
  }
}
