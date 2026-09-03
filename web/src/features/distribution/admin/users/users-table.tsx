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
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'

import { getDistributionUsers } from '../../api'
import { ERROR_MESSAGES } from '../../constants'
import { useDistributionUsersColumns } from './users-columns'
import { UsersFilterToolbar } from './users-filter-toolbar'
import { useUsers } from './users-provider'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay])

  return debouncedValue
}

export function DistributionUsersTable() {
  const { t } = useTranslation()
  const columns = useDistributionUsersColumns()
  const { refreshTrigger } = useUsers()

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [keyword, setKeyword] = useState('')
  const [groupId, setGroupId] = useState(0)
  const [frozen, setFrozen] = useState<'all' | 'true' | 'false'>('all')

  const debouncedKeyword = useDebouncedValue(keyword, 400)

  let frozenParam: boolean | undefined
  if (frozen === 'true') frozenParam = true
  else if (frozen === 'false') frozenParam = false

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'distribution-users',
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedKeyword,
      groupId,
      frozen,
      refreshTrigger,
    ],
    queryFn: async () => {
      const result = await getDistributionUsers({
        p: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        keyword: debouncedKeyword || undefined,
        group_id: groupId > 0 ? groupId : undefined,
        frozen: frozenParam,
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

  const users = data?.items || []
  const total = data?.total || 0

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  const { table } = useDataTable({
    data: users,
    columns,
    pagination,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    totalCount: total,
  })

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t('No Distribution Users')}
      emptyDescription={t(
        'No users have been assigned to a distribution group yet.'
      )}
      skeletonKeyPrefix='distribution-users-skeleton'
      applyHeaderSize
      toolbar={
        <UsersFilterToolbar
          keyword={keyword}
          onKeywordChange={(val) => {
            setKeyword(val)
            resetPage()
          }}
          groupId={groupId}
          onGroupIdChange={(val) => {
            setGroupId(val)
            resetPage()
          }}
          frozen={frozen}
          onFrozenChange={(val) => {
            setFrozen(val)
            resetPage()
          }}
        />
      }
    />
  )
}
