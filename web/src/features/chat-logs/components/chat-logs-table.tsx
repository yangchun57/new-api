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
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { useMediaQuery } from '@/hooks'
import { useTableUrlState } from '@/hooks/use-table-url-state'

import { getAllChatLogs, getUserChatLogs } from '../api'
import { ERROR_MESSAGES, getChatLogRoleOptions } from '../constants'
import type { ChatLog } from '../types'
import { useChatLogsColumns } from './chat-logs-columns'
import { useChatLogs } from './chat-logs-provider'

const route = getRouteApi('/_authenticated/chat-logs/')

export function ChatLogsTable({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation()
  const columns = useChatLogsColumns(isAdmin)
  const { refreshTrigger } = useChatLogs()
  const isMobile = useMediaQuery('(max-width: 640px)')

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: isMobile ? 10 : 20 },
    globalFilter: { enabled: true, key: 'keyword' },
    columnFilters: [{ columnId: 'role', searchKey: 'role', type: 'array' }],
  })

  const roleFilter =
    (columnFilters.find((filter) => filter.id === 'role')?.value as
      | string[]
      | undefined)?.[0] ?? ''

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'chat-logs',
      isAdmin,
      pagination.pageIndex + 1,
      pagination.pageSize,
      globalFilter,
      roleFilter,
      refreshTrigger,
    ],
    queryFn: async () => {
      const params = {
        p: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        keyword: globalFilter,
        role: roleFilter,
      }

      const result = isAdmin
        ? await getAllChatLogs(params)
        : await getUserChatLogs(params)

      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_FAILED))
        return { items: [], total: 0 }
      }

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const chatLogs: ChatLog[] = data?.items || []

  const { table } = useDataTable({
    data: chatLogs,
    columns,
    columnFilters,
    globalFilter,
    pagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const content = String(row.getValue('content')).toLowerCase()
      const model = String(row.getValue('model_name')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()
      return content.includes(searchValue) || model.includes(searchValue)
    },
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    manualPagination: true,
    manualFiltering: true,
    totalCount: data?.total || 0,
    ensurePageInRange,
  })

  const roleOptions = useMemo(() => getChatLogRoleOptions(t), [t])

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t('No Conversation Records Found')}
      emptyDescription={t(
        'No conversation content has been retained yet. Enable chat log retention to start capturing conversation content.'
      )}
      skeletonKeyPrefix='chat-logs-skeleton'
      applyHeaderSize
      toolbarProps={{
        searchPlaceholder: t('Filter by content or model...'),
        searchDebounceMs: 500,
        filters: [
          {
            columnId: 'role',
            title: t('Role'),
            options: roleOptions,
            singleSelect: true,
          },
        ],
      }}
    />
  )
}
