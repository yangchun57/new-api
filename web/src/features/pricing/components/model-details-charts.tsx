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
import { VChart } from '@visactor/react-vchart'
import { BarChart3, LineChart } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getSuccessRateColor } from '@/features/performance-metrics/lib/format'
import { cn } from '@/lib/utils'
import { VCHART_OPTION } from '@/lib/vchart'

import type { LatencyTimePoint, UptimeDayPoint } from '../lib/mock-stats'

function formatHourLabel(iso: string): string {
  const date = new Date(iso)
  const hours = date.getHours()
  return `${String(hours).padStart(2, '0')}:00`
}

function formatDayLabel(date: string): string {
  const parsed = new Date(date)
  if (date.includes('T')) {
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    })
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

const CHART_TEXT_COLOR = 'rgba(10, 14, 26, 0.5)'
const CHART_GRID_COLOR = 'rgba(10, 14, 26, 0.08)'
const CHART_SERIES_COLOR = '#0A0E1A'

const UPTIME_AXIS_MAX = 100
const UPTIME_FOCUSED_AXIS_MIN = 95
const UPTIME_MINOR_OUTAGE_AXIS_MIN = 90

function toUptimeChartValue(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(UPTIME_AXIS_MAX, Math.max(0, value))
}

function getUptimeAxisMin(values: number[]): number {
  const finiteValues = values.filter((value) => Number.isFinite(value))
  if (finiteValues.length === 0) return UPTIME_FOCUSED_AXIS_MIN

  const minValue = Math.max(0, Math.min(...finiteValues))
  if (minValue >= UPTIME_FOCUSED_AXIS_MIN) return UPTIME_FOCUSED_AXIS_MIN
  if (minValue >= UPTIME_MINOR_OUTAGE_AXIS_MIN) {
    return UPTIME_MINOR_OUTAGE_AXIS_MIN
  }

  return Math.max(0, Math.floor((minValue - 5) / 10) * 10)
}

function stripUptimePointSuffix(value: string): string {
  return value.replace(/__(start|end)$/, '')
}

function ChartEmptyState({
  message,
  className,
  icon: Icon,
}: {
  message: string
  className?: string
  icon: typeof LineChart
}) {
  return (
    <div
      className={cn(
        'flex h-48 items-center justify-center rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] px-6',
        className
      )}
    >
      <div className='flex flex-col items-center gap-2 text-center'>
        <span className='inline-flex size-8 items-center justify-center rounded-full bg-[#F0F2F6] text-[#8A93A4]'>
          <Icon className='size-4' />
        </span>
        <span className='text-[12px] text-[#8A93A4]'>{message}</span>
      </div>
    </div>
  )
}

export function LatencyTrendChart(props: {
  series: LatencyTimePoint[]
  className?: string
}) {
  const { t } = useTranslation()

  const spec = useMemo(() => {
    if (props.series.length === 0) return null
    const data = props.series.map((point) => ({
      time: formatHourLabel(point.timestamp),
      group: point.group,
      ttft: point.ttft_ms,
    }))
    return {
      type: 'line' as const,
      data: [{ id: 'latency', values: data }],
      xField: 'time',
      yField: 'ttft',
      seriesField: 'group',
      smooth: true,
      color: [CHART_SERIES_COLOR, '#5A6478', '#8A93A4'],
      point: {
        visible: true,
        style: { size: 4, stroke: '#ffffff', lineWidth: 1.5 },
      },
      line: {
        style: { lineWidth: 2 },
      },
      legends: { visible: false },
      tooltip: {
        mark: {
          title: { value: (d: { time: string }) => d.time },
          content: [
            {
              key: t('Average TTFT'),
              value: (d: { ttft: number }) => `${Math.round(d.ttft)} ms`,
            },
          ],
        },
      },
      axes: [
        {
          orient: 'bottom',
          label: {
            style: { fill: CHART_TEXT_COLOR, fontSize: 10 },
          },
          tick: { visible: false },
        },
        {
          orient: 'left',
          label: {
            formatMethod: (val: number | string) => `${val} ms`,
            style: { fill: CHART_TEXT_COLOR, fontSize: 10 },
          },
          grid: {
            visible: true,
            style: { lineDash: [3, 3], stroke: CHART_GRID_COLOR },
          },
        },
      ],
    }
  }, [props.series, t])

  if (props.series.length === 0) {
    return (
      <ChartEmptyState
        message={t('No latency data available')}
        className={props.className}
        icon={LineChart}
      />
    )
  }

  return (
    <div className={cn('h-64 sm:h-72', props.className)}>
      {spec && (
        <VChart
          spec={{
            ...spec,
            theme: 'light',
            background: 'transparent',
          }}
          option={VCHART_OPTION}
        />
      )}
    </div>
  )
}

export function UptimeTrendChart(props: {
  series: UptimeDayPoint[]
  className?: string
}) {
  const { t } = useTranslation()

  const spec = useMemo(() => {
    if (props.series.length === 0) return null

    const rawData = props.series.map((point) => ({
      date: formatDayLabel(point.date),
      uptime: toUptimeChartValue(point.uptime_pct),
      incidents: point.incidents,
      outage: point.outage_minutes,
    }))
    const data =
      rawData.length === 1
        ? [
            { ...rawData[0], date: `${rawData[0].date}__start` },
            { ...rawData[0], date: `${rawData[0].date}__end` },
          ]
        : rawData
    const axisMin = getUptimeAxisMin(rawData.map((point) => point.uptime))

    return {
      type: 'line' as const,
      data: [{ id: 'uptime', values: data }],
      xField: 'date',
      yField: 'uptime',
      smooth: true,
      line: {
        style: { stroke: '#10b981', lineWidth: 2 },
      },
      point: {
        visible: true,
        style: {
          size: 4,
          stroke: '#ffffff',
          lineWidth: 1.5,
          fill: (datum: { uptime: number }) =>
            getSuccessRateColor(datum.uptime),
        },
      },
      tooltip: {
        mark: {
          title: {
            value: (d: { date: string }) => stripUptimePointSuffix(d.date),
          },
          content: [
            {
              key: t('Uptime'),
              value: (d: { uptime: number }) => `${d.uptime.toFixed(2)}%`,
            },
            {
              key: t('Incidents'),
              value: (d: { incidents: number }) => `${d.incidents}`,
            },
            {
              key: t('Outage'),
              value: (d: { outage: number }) => `${d.outage} ${t('minutes')}`,
            },
          ],
        },
      },
      axes: [
        {
          orient: 'bottom',
          label: {
            formatMethod: (val: number | string) =>
              stripUptimePointSuffix(String(val)),
            style: { fill: CHART_TEXT_COLOR, fontSize: 10 },
            autoLimit: true,
          },
          tick: { visible: false },
        },
        {
          orient: 'left',
          min: axisMin,
          max: UPTIME_AXIS_MAX,
          label: {
            formatMethod: (val: number | string) => `${val}%`,
            style: { fill: CHART_TEXT_COLOR, fontSize: 10 },
          },
          grid: {
            visible: true,
            style: { lineDash: [3, 3], stroke: CHART_GRID_COLOR },
          },
        },
      ],
    }
  }, [props.series, t])

  if (props.series.length === 0) {
    return (
      <ChartEmptyState
        message={t('No uptime data available')}
        className={props.className}
        icon={LineChart}
      />
    )
  }

  return (
    <div className={cn('h-56 sm:h-64', props.className)}>
      {spec && (
        <VChart
          spec={{
            ...spec,
            theme: 'light',
            background: 'transparent',
          }}
          option={VCHART_OPTION}
        />
      )}
    </div>
  )
}

export function ThroughputBarChart(props: {
  rows: { group: string; throughput_tps: number }[]
  className?: string
}) {
  const { t } = useTranslation()

  const filtered = useMemo(
    () => props.rows.filter((r) => r.throughput_tps > 0),
    [props.rows]
  )

  const spec = useMemo(() => {
    if (filtered.length === 0) return null
    return {
      type: 'bar' as const,
      direction: 'horizontal' as const,
      data: [{ id: 'tput', values: filtered.map((r) => ({ ...r })) }],
      xField: 'throughput_tps',
      yField: 'group',
      bar: {
        style: {
          fill: CHART_SERIES_COLOR,
          cornerRadius: 4,
        },
      },
      label: {
        visible: true,
        position: 'right',
        style: { fontSize: 11, fill: CHART_TEXT_COLOR },
        formatMethod: (text: string) => `${text} t/s`,
      },
      axes: [
        {
          orient: 'left',
          label: { style: { fill: CHART_TEXT_COLOR, fontSize: 10 } },
          tick: { visible: false },
        },
        {
          orient: 'bottom',
          label: { style: { fill: CHART_TEXT_COLOR, fontSize: 10 } },
          grid: {
            visible: true,
            style: { lineDash: [3, 3], stroke: CHART_GRID_COLOR },
          },
        },
      ],
      tooltip: {
        mark: {
          title: { value: (d: { group: string }) => d.group },
          content: [
            {
              key: t('Throughput'),
              value: (d: { throughput_tps: number }) =>
                `${d.throughput_tps.toFixed(1)} t/s`,
            },
          ],
        },
      },
    }
  }, [filtered, t])

  if (filtered.length === 0) {
    return (
      <ChartEmptyState
        message={t('No throughput data available')}
        className={props.className}
        icon={BarChart3}
      />
    )
  }

  return (
    <div className={cn('h-48 sm:h-56', props.className)}>
      {spec && (
        <VChart
          spec={{
            ...spec,
            theme: 'light',
            background: 'transparent',
          }}
          option={VCHART_OPTION}
        />
      )}
    </div>
  )
}
