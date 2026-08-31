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
import { BarChart3, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { VCHART_OPTION } from '@/lib/vchart'

import { formatTokens } from '../lib/format'
import type { ModelHistorySeries, ModelRanking, RankingPeriod } from '../types'
import { ModelLeaderboard } from './model-leaderboard'

const PERIOD_DESCRIPTIONS: Record<RankingPeriod, string> = {
  today: 'Hourly token usage by model across the last 24 hours',
  week: 'Weekly token usage by model across the past few weeks',
  month: 'Daily token usage by model across the past month',
  year: 'Weekly token usage by model across the past year',
}

const TOOLTIP_MAX_ROWS = 10

// Premium light palette
const CHART_TEXT = 'rgba(10, 14, 26, 0.58)'
const CHART_GRID = 'rgba(10, 14, 26, 0.08)'

type ModelsSectionProps = {
  history: ModelHistorySeries
  rows: ModelRanking[]
  period: RankingPeriod
}

export function ModelsSection(props: ModelsSectionProps) {
  const { t } = useTranslation()

  const orderedPoints = useMemo(() => {
    const order = new Map(
      props.history.models.map((m, idx) => [m.name, idx] as const)
    )
    return [...props.history.points].sort((a, b) => {
      const tsCmp = a.ts.localeCompare(b.ts)
      if (tsCmp !== 0) return tsCmp
      return (order.get(a.model) ?? 999) - (order.get(b.model) ?? 999)
    })
  }, [props.history])

  const totalTokens = useMemo(
    () => props.rows.reduce((s, r) => s + r.total_tokens, 0),
    [props.rows]
  )

  const spec = useMemo(() => {
    if (orderedPoints.length === 0) return null
    return {
      type: 'bar' as const,
      data: [{ id: 'models-history', values: orderedPoints }],
      xField: 'label',
      yField: 'tokens',
      seriesField: 'model',
      stack: true,
      legends: { visible: false },
      color: ['#2E4BFF', '#6C8BFF', '#22C55E', '#94A3B8', '#CBD3E0', '#A7B3C7'],
      axes: [
        {
          orient: 'bottom',
          label: {
            style: { fill: CHART_TEXT, fontSize: 10 },
            autoHide: true,
            autoLimit: true,
          },
          tick: { visible: false },
        },
        {
          orient: 'left',
          label: {
            formatMethod: (val: number | string) => formatTokens(Number(val)),
            style: { fill: CHART_TEXT, fontSize: 10 },
          },
          grid: {
            visible: true,
            style: { lineDash: [3, 3], stroke: CHART_GRID },
          },
        },
      ],
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) =>
                String(datum?.model ?? ''),
              value: (datum: Record<string, unknown>) =>
                formatTokens(Number(datum?.tokens) || 0),
            },
          ],
        },
        dimension: {
          title: {
            value: (datum: Record<string, unknown>) =>
              String(datum?.label ?? ''),
          },
          content: [
            {
              key: (datum: Record<string, unknown>) =>
                String(datum?.model ?? ''),
              value: (datum: Record<string, unknown>) =>
                Number(datum?.tokens) || 0,
            },
          ],
          updateContent: (
            array: Array<{ key: string; value: string | number }>
          ) => {
            array.sort((a, b) => Number(b.value) - Number(a.value))
            const sum = array.reduce((s, x) => s + (Number(x.value) || 0), 0)
            const visible = array.slice(0, TOOLTIP_MAX_ROWS)
            const overflow = array.slice(TOOLTIP_MAX_ROWS)
            const result = visible.map((item) => ({
              key: item.key,
              value: formatTokens(Number(item.value) || 0),
            }))
            if (overflow.length > 0) {
              const otherSum = overflow.reduce(
                (s, item) => s + (Number(item.value) || 0),
                0
              )
              result.push({
                key: t('+{{count}} more', { count: overflow.length }),
                value: formatTokens(otherSum),
              })
            }
            result.unshift({ key: t('Total:'), value: formatTokens(sum) })
            return result
          },
        },
      },
      animationAppear: { duration: 500 },
    }
  }, [orderedPoints, t])

  return (
    <section className='pl-card pl-card-hover'>
      <header className='flex items-start justify-between gap-4 border-b border-[#E5E8EE] px-6 py-5'>
        <div className='min-w-0 flex-1'>
          <h2 className='pl-font-display inline-flex items-center gap-2 text-[15px] font-semibold text-[#0A0E1A]'>
            <BarChart3 className='size-4 text-[#2E4BFF]' />
            {t('Top Models')}
          </h2>
          <p className='mt-1 text-[13px] text-[#5A6478]'>
            {t(PERIOD_DESCRIPTIONS[props.period])}
          </p>
        </div>
        <div className='shrink-0 text-right'>
          <div className='pl-font-display text-2xl font-bold tabular-nums text-[#0A0E1A]'>
            {formatTokens(totalTokens)}
          </div>
          <div className='pl-font-mono mt-1 text-[10px] text-[#8A93A4]'>
            {t('tokens')}
          </div>
        </div>
      </header>

      <div className='px-6 pt-5 pb-2'>
        <div className='h-60 sm:h-72'>
          {spec ? (
            <VChart
              key={`models-history-light-${props.period}`}
              spec={{
                ...spec,
                theme: 'light',
                background: 'transparent',
              }}
              option={VCHART_OPTION}
            />
          ) : (
            <div className='flex h-full items-center justify-center text-xs text-[#8A93A4]'>
              {t('No history data available')}
            </div>
          )}
        </div>
      </div>

      <div className='border-t border-[#E5E8EE] px-6 pt-4 pb-5'>
        <header className='mb-2'>
          <h3 className='pl-font-display inline-flex items-center gap-2 text-[13px] font-semibold text-[#0A0E1A]'>
            <Trophy className='size-3.5 text-[#D4A017]' />
            {t('LLM Leaderboard')}
          </h3>
          <p className='mt-0.5 text-[12px] text-[#8A93A4]'>
            {t('Compare the most popular models on the platform')}
          </p>
        </header>
        {props.rows.length === 0 ? (
          <div className='py-8 text-center text-sm text-[#8A93A4]'>
            {t('No models match the selected filters')}
          </div>
        ) : (
          <ModelLeaderboard rows={props.rows} />
        )}
      </div>
    </section>
  )
}
