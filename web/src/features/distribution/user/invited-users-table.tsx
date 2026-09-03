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
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { TableId } from '@/components/table-id'
import { formatQuota, formatTimestampToDate } from '@/lib/format'

import { getSelfInvitedUsers } from '../api'
import { ERROR_MESSAGES } from '../constants'
import type { InvitedUserItem } from '../types'

function useInvitedUsersColumns(): ColumnDef<InvitedUserItem>[] {
  const { t } = useTranslation()
  return [
    {
      accessorKey: 'id',
      header: t('ID'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <TableId value={row.getValue('id')} className='w-[60px]' />
      ),
      size: 80,
    },
    {
      accessorKey: 'username',
      header: t('Username'),
      meta: { mobileTitle: true },
      cell: ({ row }) => (
        <span className='text-[13px] font-medium text-[#0A0E1A]'>
          {row.getValue('username')}
        </span>
      ),
      size: 150,
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
      accessorKey: 'used_quota',
      header: t('Used Quota'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <span className='text-[13px] tabular-nums text-[#5A6478]'>
          {formatQuota(row.getValue('used_quota'))}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      meta: { mobileBadge: true },
      cell: ({ row }) => {
        const disabled = row.original.status === 2
        return (
          <StatusBadge
            label={t(disabled ? 'Disabled' : 'Enabled')}
            variant={disabled ? 'neutral' : 'success'}
            copyable={false}
            className='-ml-1.5'
          />
        )
      },
      size: 110,
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
  ]
}

export function InvitedUsersTable() {
  const { t } = useTranslation()
  const columns = useInvitedUsersColumns()

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'self-distribution-invitees',
      pagination.pageIndex + 1,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const result = await getSelfInvitedUsers({
        p: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      })
      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_USERS_FAILED))
        return { items: [], total: 0 }
      }
      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const invitees = data?.items || []

  const { table } = useDataTable({
    data: invitees,
    columns,
    pagination,
    onPaginationChange: setPagination,
    manualPagination: true,
    totalCount: data?.total || 0,
  })

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t('No Invited Users')}
      emptyDescription={t(
        'Share your invite link to get started. Invited accounts will appear here.'
      )}
      skeletonKeyPrefix='self-distribution-invitees-skeleton'
      applyHeaderSize
    />
  )
}
