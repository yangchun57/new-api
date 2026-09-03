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
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getDistributionGroups } from '../../api'
import { ERROR_MESSAGES } from '../../constants'

type UsersFilterToolbarProps = {
  keyword: string
  onKeywordChange: (value: string) => void
  groupId: number
  onGroupIdChange: (value: number) => void
  frozen: 'all' | 'true' | 'false'
  onFrozenChange: (value: 'all' | 'true' | 'false') => void
}

export function UsersFilterToolbar(props: UsersFilterToolbarProps) {
  const { t } = useTranslation()
  const {
    keyword,
    onKeywordChange,
    groupId,
    onGroupIdChange,
    frozen,
    onFrozenChange,
  } = props

  const { data: groupsData } = useQuery({
    queryKey: ['distribution-groups-options'],
    queryFn: async () => {
      const result = await getDistributionGroups()
      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_GROUPS_FAILED))
        return []
      }
      return result.data || []
    },
  })
  const groups = groupsData || []

  const frozenItems = useMemo(
    () => [
      { value: 'all', label: t('All Status') },
      { value: 'true', label: t('Frozen') },
      { value: 'false', label: t('Active') },
    ],
    [t]
  )

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Input
        type='text'
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder={t('Search by username, email, ID...')}
        className='h-8 w-[240px] text-sm'
        aria-label={t('Search')}
      />
      <Select
        items={[
          { value: '0', label: t('All Groups') },
          ...groups.map((g) => ({
            value: String(g.id),
            label: `${g.name} (${g.commission_rate}%)`,
          })),
        ]}
        value={String(groupId)}
        onValueChange={(value) => {
          onGroupIdChange(value ? Number.parseInt(value, 10) || 0 : 0)
        }}
      >
        <SelectTrigger className='h-8 w-[200px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectItem value='0'>{t('All Groups')}</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name} ({g.commission_rate}%)
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        items={frozenItems}
        value={frozen}
        onValueChange={(value) => {
          if (value === 'true' || value === 'false' || value === 'all') {
            onFrozenChange(value)
          }
        }}
      >
        <SelectTrigger className='h-8 w-[140px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {frozenItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
