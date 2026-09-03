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
import type { Row } from '@tanstack/react-table'
import { Trash2, Edit, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { DistributionGroup } from '../../types'
import { useGroups } from './groups-provider'

export function GroupRowActions({ row }: { row: Row<DistributionGroup> }) {
  const { t } = useTranslation()
  const group = row.original
  const { setOpen, setCurrentRow } = useGroups()

  return (
    <div className='-ml-1.5 flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setCurrentRow(group)
                setOpen('members')
              }}
              aria-label={t('View Members')}
            />
          }
        >
          <Users />
        </TooltipTrigger>
        <TooltipContent>{t('View Members')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setCurrentRow(group)
                setOpen('update')
              }}
              aria-label={t('Edit')}
            />
          }
        >
          <Edit />
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-destructive hover:text-destructive'
              onClick={() => {
                setCurrentRow(group)
                setOpen('delete')
              }}
              disabled={group.is_default}
              aria-label={t('Delete')}
            />
          }
        >
          <Trash2 />
        </TooltipTrigger>
        <TooltipContent>
          {group.is_default ? t('Default group cannot be deleted') : t('Delete')}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
