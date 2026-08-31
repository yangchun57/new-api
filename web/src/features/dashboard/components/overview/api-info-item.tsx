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
import { Zap, ExternalLink, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  getLatencyColorClass,
  openExternalSpeedTest,
} from '@/features/dashboard/lib/api-info'
import type { ApiInfoItem, PingStatus } from '@/features/dashboard/types'
import { getBgColorClass } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface ApiInfoItemProps {
  item: ApiInfoItem
  status: PingStatus
  onTest: (url: string) => void
}

export function ApiInfoItemComponent(props: ApiInfoItemProps) {
  const { t } = useTranslation()
  const item = props.item
  const status = props.status

  return (
    <div className='group flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-[#F7F8FA] sm:gap-3 sm:px-5 sm:py-3'>
      <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
        <span
          className={cn(
            'inline-block size-2 shrink-0 rounded-full',
            getBgColorClass(item.color)
          )}
        />

        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <div className='flex items-baseline gap-2'>
            <span className='font-mono text-[13px] font-semibold tracking-[-0.01em] text-[#0A0E1A]'>
              {item.route}
            </span>
            <span className='hidden truncate text-[12px] text-[#8A93A4] md:inline'>
              {item.description}
            </span>
          </div>
          <span className='truncate font-mono text-[11px] text-[#B8BFCC]'>
            {item.url}
          </span>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <div className='flex items-center'>
          {status.testing && (
            <StatusBadge
              label={t('Testing...')}
              variant='warning'
              className='animate-pulse'
              copyable={false}
            />
          )}
          {status.latency !== null && !status.testing && (
            <StatusBadge
              variant='success'
              label={`${status.latency}${t('ms')}`}
              className={cn(
                'font-mono font-medium',
                getLatencyColorClass(status.latency)
              )}
              copyable={false}
            />
          )}
          {status.error && (
            <StatusBadge label={t('N/A')} variant='neutral' copyable={false} />
          )}
        </div>

        <div className='flex items-center gap-0.5'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => props.onTest(item.url)}
            disabled={status.testing}
            className='size-7 p-0 text-[#8A93A4] hover:bg-white hover:text-[#0A0E1A]'
            title={t('Test Latency')}
          >
            <Zap
              className={cn('size-3.5', status.testing && 'animate-pulse')}
            />
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => openExternalSpeedTest(item.url)}
            className='hidden size-7 p-0 text-[#8A93A4] hover:bg-white hover:text-[#0A0E1A] sm:inline-flex'
            title={t('External Speed Test')}
          >
            <Gauge className='size-3.5' />
          </Button>

          <CopyButton
            value={item.url}
            variant='ghost'
            size='sm'
            className='size-7 p-0 text-[#8A93A4] hover:bg-white hover:text-[#0A0E1A]'
            iconClassName='size-3.5'
            tooltip={t('Copy URL')}
            aria-label={t('Copy URL')}
          />

          <Button
            variant='ghost'
            size='sm'
            className='hidden size-7 p-0 text-[#8A93A4] hover:bg-white hover:text-[#0A0E1A] sm:inline-flex'
            title={t('Open in New Tab')}
            render={<a href={item.url} target='_blank' rel='noreferrer' />}
          >
            <ExternalLink className='size-3.5' />
          </Button>
        </div>
      </div>
    </div>
  )
}
