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
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatUptimePct,
  getSuccessRateDotClass,
  getSuccessRateTextClass,
} from '@/features/performance-metrics/lib/format'
import { cn } from '@/lib/utils'

import { aggregateUptime, type UptimeDayPoint } from '../lib/mock-stats'

type SparklineSize = 'sm' | 'md'

type UptimeSparklineProps = {
  series: UptimeDayPoint[]
  size?: SparklineSize
  showOverall?: boolean
  emptyLabel?: string
  className?: string
}

function heightFor(uptime: number): string {
  if (uptime >= 99.9) return 'h-full'
  if (uptime >= 99.0) return 'h-[88%]'
  if (uptime >= 95.0) return 'h-[72%]'
  if (uptime >= 90.0) return 'h-[55%]'
  return 'h-[40%]'
}

export function UptimeSparkline(props: UptimeSparklineProps) {
  const size = props.size ?? 'md'
  const showOverall = props.showOverall ?? true

  if (props.series.length === 0) {
    return (
      <span className={cn('text-[12px] text-[#B8BFCC]', props.className)}>
        {props.emptyLabel ?? '–'}
      </span>
    )
  }

  const overall =
    props.series.reduce((s, p) => s + p.uptime_pct, 0) / props.series.length

  const containerHeight = size === 'sm' ? 'h-3.5' : 'h-5'
  const barWidth = size === 'sm' ? 'w-[3px]' : 'w-1'
  const gap = size === 'sm' ? 'gap-px' : 'gap-[2px]'

  return (
    <div className={cn('flex items-center gap-2', props.className)}>
      <div
        className={cn('flex items-end', containerHeight, gap)}
        role='img'
        aria-label={`30 day uptime ${overall.toFixed(2)}%`}
      >
        {props.series.map((day) => (
          <Tooltip key={day.date}>
            <TooltipTrigger
              render={
                <div
                  className={cn(
                    'rounded-sm transition-opacity hover:opacity-80',
                    barWidth,
                    containerHeight,
                    'flex items-end'
                  )}
                />
              }
            >
              <div
                className={cn(
                  'w-full rounded-sm',
                  getSuccessRateDotClass(day.uptime_pct),
                  heightFor(day.uptime_pct)
                )}
                aria-hidden
              />
            </TooltipTrigger>
            <TooltipContent
              side='top'
              className='rounded-lg border border-[#E5E8EE] bg-white px-2.5 py-1.5 font-mono text-[11px] text-[#0A0E1A] shadow-md'
            >
              <div className='font-medium'>{day.date}</div>
              <div>{day.uptime_pct.toFixed(2)}%</div>
              {day.outage_minutes > 0 && (
                <div className='text-[#8A93A4]'>
                  {day.outage_minutes} min outage
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {showOverall && (
        <span
          className={cn(
            'font-mono text-[13px] font-semibold tabular-nums',
            getSuccessRateTextClass(overall)
          )}
        >
          {overall.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

export function UptimeStatusRow(props: {
  series: UptimeDayPoint[]
  className?: string
}) {
  const { t } = useTranslation()
  const summary = useMemo(() => aggregateUptime(props.series), [props.series])
  const status = useMemo(() => {
    if (summary.uptime_pct >= 99.9) return 'operational'
    if (summary.uptime_pct >= 99.0) return 'minor'
    if (summary.uptime_pct >= 95.0) return 'degraded'
    return 'major'
  }, [summary.uptime_pct])

  const StatusIcon =
    status === 'operational'
      ? CheckCircle2
      : status === 'minor'
        ? Activity
        : AlertCircle

  const statusIconColor =
    status === 'operational' || status === 'minor'
      ? 'text-emerald-600'
      : status === 'degraded'
        ? 'text-amber-600'
        : 'text-rose-600'

  const statusLabelColor =
    status === 'operational' || status === 'minor'
      ? 'text-emerald-700'
      : status === 'degraded'
        ? 'text-[#B45309]'
        : 'text-rose-600'

  const iconWrapColour =
    status === 'operational' || status === 'minor'
      ? 'bg-emerald-50 ring-emerald-200'
      : status === 'degraded'
        ? 'bg-[#FEF9E7] ring-[#FCD34D]/60'
        : 'bg-rose-50 ring-rose-200'

  const statusLabel =
    status === 'operational'
      ? t('All systems operational')
      : status === 'minor'
        ? t('Minor blips in the last 30 days')
        : status === 'degraded'
          ? t('Degraded performance recently')
          : t('Significant outages detected')

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border border-[#E5E8EE] bg-white px-4 py-3 shadow-sm sm:gap-4',
        props.className
      )}
    >
      <div className='flex items-center gap-2.5'>
        <span
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-full ring-1',
            iconWrapColour
          )}
        >
          <StatusIcon className={cn('size-3.5 shrink-0', statusIconColor)} />
        </span>
        <div className='flex flex-col'>
          <span className='text-[13px] font-semibold text-[#0A0E1A]'>
            {t('Last 30 days uptime')}
          </span>
          <span className={cn('text-[12px] font-medium', statusLabelColor)}>
            {statusLabel}
          </span>
        </div>
      </div>

      <UptimeSparkline series={props.series} className='ml-auto' />

      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8A93A4]'>
        {summary.incidents > 0 && (
          <span>
            {summary.incidents}{' '}
            {summary.incidents === 1 ? t('incident') : t('incidents')}
          </span>
        )}
        {summary.outage_minutes > 0 && (
          <span>
            {summary.outage_minutes} {t('min downtime')}
          </span>
        )}
        <span className='hidden sm:inline'>
          {formatUptimePct(summary.uptime_pct)} {t('overall')}
        </span>
      </div>
    </div>
  )
}
