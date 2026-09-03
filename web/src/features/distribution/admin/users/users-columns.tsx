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

import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import { TableId } from '@/components/table-id'
import { formatTimestampToDate } from '@/lib/format'

import type { DistributionUserItem } from '../../types'
import { UsersRowActions } from './users-row-actions'

export function useDistributionUsersColumns(): ColumnDef<DistributionUserItem>[] {
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
      accessorKey: 'username',
      header: t('Username'),
      meta: { mobileTitle: true },
      cell: ({ row }) => (
        <span className='text-[13px] font-medium text-[#0A0E1A]'>
          {row.getValue('username') as string}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: 'display_name',
      header: t('Display Name'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const name = row.getValue('display_name') as string
        return (
          <span className='text-[13px] text-[#5A6478]'>{name || '-'}</span>
        )
      },
      size: 130,
    },
    {
      accessorKey: 'email',
      header: t('Email'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const email = row.getValue('email') as string
        return (
          <span className='text-[13px] text-[#5A6478]'>{email || '-'}</span>
        )
      },
      size: 200,
    },
    {
      accessorKey: 'group_name',
      header: t('Distribution Group'),
      cell: ({ row }) => {
        const name = row.getValue('group_name') as string
        const rate = row.original.commission_rate
        if (!name) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <div className='flex items-center gap-1.5'>
            <span className='text-[13px] font-medium text-[#0A0E1A]'>
              {name}
            </span>
            <Badge variant='secondary' className='font-mono text-[11px]'>
              {rate}%
            </Badge>
          </div>
        )
      },
      size: 180,
    },
    {
      accessorKey: 'distribution_frozen',
      header: t('Status'),
      meta: { mobileBadge: true },
      cell: ({ row }) => {
        const frozen = row.getValue('distribution_frozen') as boolean
        return frozen ? (
          <StatusBadge
            label={t('Frozen')}
            variant='warning'
            copyable={false}
            className='-ml-1.5'
          />
        ) : (
          <StatusBadge
            label={t('Active')}
            variant='success'
            copyable={false}
            className='-ml-1.5'
          />
        )
      },
      size: 110,
    },
    {
      accessorKey: 'distribution_debt',
      header: t('Debt'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const debt = row.getValue('distribution_debt') as number
        if (debt <= 0) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='text-[13px] font-semibold text-red-600'>
            {debt.toLocaleString()}
          </span>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'aff_count',
      header: t('Invites'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <Badge variant='secondary' className='font-mono text-[12px]'>
          {row.getValue('aff_count') as number}
        </Badge>
      ),
      size: 90,
    },
    {
      accessorKey: 'inviter_id',
      header: t('Inviter'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const inviterId = row.getValue('inviter_id') as number
        if (inviterId <= 0) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='font-mono text-[12px] text-[#5A6478]'>
            #{inviterId}
          </span>
        )
      },
      size: 90,
    },
    {
      accessorKey: 'created_at',
      header: t('Joined'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <div className='min-w-[160px] font-mono text-[12px] text-[#8A93A4]'>
          {formatTimestampToDate(row.getValue('created_at'))}
        </div>
      ),
      size: 180,
    },
    {
      id: 'actions',
      header: () => t('Actions'),
      cell: ({ row }) => <UsersRowActions row={row} />,
      meta: { pinned: 'right' as const },
    },
  ]
}
