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
import { TableId } from '@/components/table-id'
import { formatQuota, formatTimestampToDate } from '@/lib/format'

import { LEDGER_TYPES } from '../../constants'
import type { DistributionLedger } from '../../types'

export function useLedgerColumns(options?: {
  hideOwner?: boolean
}): ColumnDef<DistributionLedger>[] {
  const { t } = useTranslation()
  const columns: ColumnDef<DistributionLedger>[] = [
    {
      accessorKey: 'id',
      header: t('ID'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <TableId value={row.getValue('id') as number} className='w-[70px]' />
      ),
      size: 90,
    },
  ]

  if (!options?.hideOwner) {
    columns.push({
      accessorKey: 'user_id',
      header: t('Commission Owner'),
      meta: { mobileTitle: true },
      cell: ({ row }) => (
        <span className='text-[13px] font-medium text-[#0A0E1A]'>
          {t('User {{id}}', { id: row.getValue('user_id') as number })}
        </span>
      ),
      size: 140,
    })
  }

  columns.push(
    {
      accessorKey: 'invitee_id',
      header: t('Referred User'),
      meta: options?.hideOwner ? { mobileTitle: true } : undefined,
      cell: ({ row }) => {
        const inviteeId = row.getValue('invitee_id') as number
        if (!inviteeId) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='text-[13px] text-[#5A6478]'>
            {t('User {{id}}', { id: inviteeId })}
          </span>
        )
      },
      size: 140,
    },
    {
      accessorKey: 'type',
      header: t('Type'),
      meta: { mobileBadge: true },
      cell: ({ row }) => {
        const type = row.getValue('type') as number
        const config = LEDGER_TYPES[type]
        if (!config) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <StatusBadge
            label={t(config.labelKey)}
            variant={config.variant}
            copyable={false}
            className='-ml-1.5'
          />
        )
      },
      size: 130,
    },
    {
      accessorKey: 'amount',
      header: t('Amount'),
      cell: ({ row }) => (
        <span className='text-[13px] font-semibold text-[#0A0E1A]'>
          {formatQuota(row.getValue('amount') as number)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'consumed_quota',
      header: t('Consumed Quota'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <span className='text-[13px] text-[#5A6478]'>
          {formatQuota(row.getValue('consumed_quota') as number)}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: 'credited',
      header: t('Credited'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <span className='text-[13px] text-[#5A6478]'>
          {formatQuota(row.getValue('credited') as number)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'debt_applied',
      header: t('Debt Applied'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <span className='text-[13px] text-[#5A6478]'>
          {formatQuota(row.getValue('debt_applied') as number)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'settle_date',
      header: t('Settle Date'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const settleDate = row.getValue('settle_date') as string
        if (!settleDate) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='font-mono text-[12px] text-[#8A93A4]'>
            {settleDate}
          </span>
        )
      },
      size: 110,
    },
    {
      accessorKey: 'created_time',
      header: t('Created'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <div className='min-w-[160px] font-mono text-[12px] text-[#8A93A4]'>
          {formatTimestampToDate(row.getValue('created_time'))}
        </div>
      ),
      size: 180,
    }
  )

  return columns
}
