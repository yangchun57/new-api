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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'

import { getDistributionGroups } from '../../api'
import { ERROR_MESSAGES } from '../../constants'
import { useGroupsColumns } from './groups-columns'
import { useGroups } from './groups-provider'

export function GroupsTable() {
  const { t } = useTranslation()
  const columns = useGroupsColumns()
  const { refreshTrigger } = useGroups()

  const { data, isLoading } = useQuery({
    queryKey: ['distribution-groups', refreshTrigger],
    queryFn: async () => {
      const result = await getDistributionGroups()
      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_GROUPS_FAILED))
        return []
      }
      return result.data || []
    },
    placeholderData: (previousData) => previousData,
  })

  const groups = useMemo(() => data || [], [data])

  const { table } = useDataTable({
    data: groups,
    columns,
    withFilteredRowModel: false,
    withFacetedRowModel: false,
  })

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      emptyTitle={t('No Distribution Groups')}
      emptyDescription={t(
        'Create a distribution group to define a commission rate for referrals.'
      )}
      skeletonKeyPrefix='distribution-groups-skeleton'
      applyHeaderSize
    />
  )
}
