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
import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { TableId } from '@/components/table-id'
import { formatTimestampToDate } from '@/lib/format'

import type { DistributionGroup } from '../../types'
import { GroupRowActions } from './groups-row-actions'

export function useGroupsColumns(): ColumnDef<DistributionGroup>[] {
  const { t } = useTranslation()
  return [
    {
      accessorKey: 'id',
      header: t('ID'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <TableId value={row.getValue('id') as number} className='w-[60px]' />
      ),
      size: 80,
    },
    {
      accessorKey: 'name',
      header: t('Name'),
      meta: { mobileTitle: true },
      cell: ({ row }) => (
        <span className='text-[13px] font-medium text-[#0A0E1A]'>
          {row.getValue('name')}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: 'commission_rate',
      header: t('Commission Rate'),
      cell: ({ row }) => (
        <span className='text-[13px] font-semibold text-emerald-600'>
          {row.getValue('commission_rate') as number}%
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: 'member_count',
      header: t('Members'),
      cell: ({ row }) => {
        const count = row.getValue('member_count') as number
        return (
          <Badge variant='secondary' className='font-mono text-[12px]'>
            {count}
          </Badge>
        )
      },
      size: 100,
    },
    {
      accessorKey: 'is_default',
      header: t('Default'),
      meta: { mobileBadge: true },
      cell: ({ row }) =>
        row.getValue('is_default') ? (
          <StatusBadge
            label={t('Default')}
            variant='success'
            copyable={false}
            className='-ml-1.5'
          />
        ) : (
          <span className='text-[13px] text-[#8A93A4]'>-</span>
        ),
      size: 100,
    },
    {
      accessorKey: 'description',
      header: t('Description'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const description = row.getValue('description') as string | undefined
        if (!description) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='line-clamp-1 text-[13px] text-[#5A6478]'>
            {description}
          </span>
        )
      },
      size: 240,
    },
    {
      accessorKey: 'updated_time',
      header: t('Updated'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <div className='min-w-[160px] font-mono text-[12px] text-[#8A93A4]'>
          {formatTimestampToDate(row.getValue('updated_time'))}
        </div>
      ),
      size: 180,
    },
    {
      id: 'actions',
      header: () => t('Actions'),
      cell: ({ row }) => <GroupRowActions row={row} />,
      meta: { pinned: 'right' as const },
    },
  ]
}
