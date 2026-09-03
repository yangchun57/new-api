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

import { Badge } from '@/components/ui/badge'
import { DataTablePagination, DataTableView, useDataTable } from '@/components/data-table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StatusBadge } from '@/components/status-badge'
import { TableId } from '@/components/table-id'
import { formatTimestampToDate } from '@/lib/format'
import {
  sideDrawerContentClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'

import { getDistributionGroupMembers } from '../../api'
import { ERROR_MESSAGES } from '../../constants'
import type { DistributionGroup, DistributionUserItem } from '../../types'
import { useGroups } from './groups-provider'

function useMemberColumns(): ColumnDef<DistributionUserItem>[] {
  const { t } = useTranslation()
  return [
    {
      accessorKey: 'id',
      header: t('ID'),
      size: 70,
      cell: ({ row }) => (
        <TableId value={row.getValue('id') as number} className='w-[60px]' />
      ),
    },
    {
      accessorKey: 'username',
      header: t('Username'),
      cell: ({ row }) => (
        <span className='text-[13px] font-medium text-[#0A0E1A]'>
          {row.getValue('username') as string}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: 'display_name',
      header: t('Display Name'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const name = row.getValue('display_name') as string
        return (
          <span className='text-[13px] text-[#5A6478]'>
            {name || '-'}
          </span>
        )
      },
      size: 140,
    },
    {
      accessorKey: 'email',
      header: t('Email'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const email = row.getValue('email') as string
        return (
          <span className='text-[13px] text-[#5A6478]'>
            {email || '-'}
          </span>
        )
      },
      size: 200,
    },
    {
      accessorKey: 'distribution_frozen',
      header: t('Status'),
      size: 110,
      cell: ({ row }) => {
        const frozen = row.getValue('distribution_frozen') as boolean
        return frozen ? (
          <StatusBadge label={t('Frozen')} variant='warning' copyable={false} />
        ) : (
          <StatusBadge label={t('Active')} variant='success' copyable={false} />
        )
      },
    },
    {
      accessorKey: 'aff_count',
      header: t('Invites'),
      meta: { mobileHidden: true },
      size: 90,
      cell: ({ row }) => (
        <Badge variant='secondary' className='font-mono text-[12px]'>
          {row.getValue('aff_count') as number}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: t('Joined'),
      meta: { mobileHidden: true },
      size: 170,
      cell: ({ row }) => (
        <div className='min-w-[150px] font-mono text-[12px] text-[#8A93A4]'>
          {formatTimestampToDate(row.getValue('created_at'))}
        </div>
      ),
    },
  ]
}

export function GroupsMembersDrawer() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow } = useGroups()
  const isOpen = open === 'members'
  const group = isOpen ? currentRow : null

  const columns = useMemberColumns()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  const groupId = group?.id ?? 0
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'distribution-group-members',
      groupId,
      pagination.pageIndex + 1,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const result = await getDistributionGroupMembers(groupId, {
        p: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      })
      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_MEMBERS_FAILED))
        return { items: [], total: 0 }
      }
      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    enabled: isOpen && groupId > 0,
    placeholderData: (previousData) => previousData,
  })

  const items = data?.items || []
  const total = data?.total || 0

  const { table } = useDataTable({
    data: items,
    columns,
    pagination,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    totalCount: total,
  })

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(isO) => {
        if (!isO) {
          setOpen(null)
          setPagination({ pageIndex: 0, pageSize: 20 })
        }
      }}
    >
      <SheetContent
        side='right'
        className={sideDrawerContentClassName('sm:max-w-3xl')}
        showCloseButton
      >
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>
            {group
              ? t('Members of {{group}}', { group: group.name })
              : t('Group Members')}
          </SheetTitle>
          <SheetDescription>
            {group
              ? t('{{rate}}% commission rate · {{count}} members', {
                  rate: group.commission_rate,
                  count: group.member_count,
                })
              : ''}
          </SheetDescription>
        </SheetHeader>
        <div className={sideDrawerFormClassName('gap-4')}>
          <DataTableView
            table={table}
            isLoading={isLoading || isFetching}
            containerClassName='rounded-md border'
            tableContainerClassName='max-h-[60vh] overflow-auto'
            splitHeader
            splitHeaderScrollClassName='max-h-[60vh]'
            applyHeaderSize
            emptyTitle={t('No members')}
            emptyDescription={t('No users are assigned to this group yet.')}
            skeletonKeyPrefix='group-members-skeleton'
          />
          <DataTablePagination table={table} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
