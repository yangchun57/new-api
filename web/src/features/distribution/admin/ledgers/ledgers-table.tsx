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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { useTableUrlState } from '@/hooks/use-table-url-state'

import { getDistributionLedgers } from '../../api'
import { ERROR_MESSAGES } from '../../constants'
import { useLedgerColumns } from './ledgers-columns'

const route = getRouteApi('/_authenticated/distribution/ledgers')

export function LedgersTable() {
  const { t } = useTranslation()
  const columns = useLedgerColumns()
  const search = route.useSearch()

  const { pagination, onPaginationChange, ensurePageInRange } = useTableUrlState({
    search: search as Record<string, unknown>,
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
  })

  const userId = search.userId ?? 0

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'distribution-ledgers',
      pagination.pageIndex + 1,
      pagination.pageSize,
      userId,
    ],
    queryFn: async () => {
      const result = await getDistributionLedgers({
        p: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        user_id: userId || undefined,
      })
      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_LEDGERS_FAILED))
        return { items: [], total: 0 }
      }
      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const ledgers = data?.items || []

  const { table } = useDataTable({
    data: ledgers,
    columns,
    pagination,
    onPaginationChange,
    manualPagination: true,
    totalCount: data?.total || 0,
    ensurePageInRange,
  })

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t('No Distribution Ledgers')}
      emptyDescription={t(
        'No distribution commission records yet. Settlements appear here after the daily run.'
      )}
      skeletonKeyPrefix='distribution-ledgers-skeleton'
      applyHeaderSize
    />
  )
}
