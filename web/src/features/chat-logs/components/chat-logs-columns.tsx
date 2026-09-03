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
import { formatTimestampToDate } from '@/lib/format'

import { getChatLogRoleVariant } from '../constants'
import type { ChatLog } from '../types'
import { ChatLogRowActions } from './chat-logs-row-actions'

export function useChatLogsColumns(isAdmin: boolean): ColumnDef<ChatLog>[] {
  const { t } = useTranslation()

  const columns: ColumnDef<ChatLog>[] = [
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
      accessorKey: 'role',
      header: t('Role'),
      meta: { mobileTitle: true },
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return (
          <StatusBadge
            label={role}
            variant={getChatLogRoleVariant(role)}
            copyable={false}
            className='-ml-1.5'
          />
        )
      },
      size: 120,
    },
    {
      accessorKey: 'model_name',
      header: t('Model'),
      cell: ({ row }) => {
        const model = row.getValue('model_name') as string
        return model ? (
          <span className='font-mono text-[12px] text-[#0A0E1A]'>{model}</span>
        ) : (
          <span className='text-[13px] text-[#8A93A4]'>-</span>
        )
      },
      size: 180,
    },
    {
      accessorKey: 'content',
      header: t('Content'),
      cell: ({ row }) => {
        const content = row.getValue('content') as string
        if (!content) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='text-[13px] leading-snug text-[#0A0E1A] line-clamp-2'>
            {content}
          </span>
        )
      },
      size: 400,
    },
    {
      accessorKey: 'prompt_tokens',
      header: t('Prompt'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const tokens = row.getValue('prompt_tokens') as number
        return (
          <span className='font-mono text-[12px] text-[#5A6478]'>
            {tokens > 0 ? tokens.toLocaleString() : '-'}
          </span>
        )
      },
      size: 100,
    },
    {
      accessorKey: 'completion_tokens',
      header: t('Completion'),
      meta: { mobileHidden: true },
      cell: ({ row }) => {
        const tokens = row.getValue('completion_tokens') as number
        return (
          <span className='font-mono text-[12px] text-[#5A6478]'>
            {tokens > 0 ? tokens.toLocaleString() : '-'}
          </span>
        )
      },
      size: 110,
    },
    {
      accessorKey: 'created_at',
      header: t('Created'),
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
      cell: ({ row }) => <ChatLogRowActions row={row} />,
      meta: { pinned: 'right' as const },
    },
  ]

  if (isAdmin) {
    columns.splice(1, 0, {
      accessorKey: 'user_id',
      header: t('User'),
      cell: ({ row }) => {
        const userId = row.getValue('user_id') as number
        if (userId === 0) {
          return <span className='text-[13px] text-[#8A93A4]'>-</span>
        }
        return (
          <span className='font-mono text-[12px] text-[#0A0E1A]'>
            {t('User {{id}}', { id: userId })}
          </span>
        )
      },
      size: 120,
    })
  }

  return columns
}
