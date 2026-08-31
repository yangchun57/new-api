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
import { PieChart } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { VCHART_OPTION } from '@/lib/vchart'

import { formatShare, formatTokens } from '../lib/format'
import type { RankingPeriod, VendorRanking, VendorShareSeries } from '../types'
import { VendorLink } from './entity-links'

const PERIOD_DESCRIPTIONS: Record<RankingPeriod, string> = {
  today: 'Token share by model author across the last 24 hours',
  week: 'Token share by model author across the past few weeks',
  month: 'Token share by model author across the past month',
  year: 'Token share by model author across the past year',
}

const VENDOR_COLOURS: Record<string, string> = {
  OpenAI: '#10a37f',
  Anthropic: '#d97757',
  Google: '#4285f4',
  DeepSeek: '#7c5cff',
  Alibaba: '#ff9900',
  xAI: '#1f2937',
  Meta: '#1877f2',
  Moonshot: '#ec4899',
  Zhipu: '#06b6d4',
  Mistral: '#ff7000',
  ByteDance: '#3b82f6',
  Tencent: '#22c55e',
  MiniMax: '#a855f7',
  Cohere: '#fb923c',
  Baidu: '#ef4444',
  Others: '#94a3b8',
}

const FALLBACK_PALETTE = [
  '#2E4BFF',
  '#22C55E',
  '#A855F7',
  '#F97316',
  '#14B8A6',
  '#EAB308',
  '#EC4899',
  '#84CC16',
  '#6366F1',
  '#10B981',
  '#F43F5E',
  '#0891B2',
  '#94A3B8',
]

function buildVendorColourMap(names: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  let fallbackIdx = 0
  for (const name of names) {
    if (VENDOR_COLOURS[name]) {
      result[name] = VENDOR_COLOURS[name]
    } else {
      result[name] = FALLBACK_PALETTE[fallbackIdx % FALLBACK_PALETTE.length]
      fallbackIdx += 1
    }
  }
  return result
}

const MAX_VENDORS_IN_LIST = 12
const CHART_TEXT = 'rgba(10, 14, 26, 0.58)'
const CHART_GRID = 'rgba(10, 14, 26, 0.08)'

type MarketShareSectionProps = {
  history: VendorShareSeries
  rows: VendorRanking[]
  period: RankingPeriod
}

export function MarketShareSection(props: MarketShareSectionProps) {
  const { t } = useTranslation()

  const colourMap = useMemo(
    () => buildVendorColourMap(props.history.vendors.map((v) => v.name)),
    [props.history]
  )

  const orderedPoints = useMemo(() => {
    const order = new Map(
      props.history.vendors.map((v, idx) => [v.name, idx] as const)
    )
    return [...props.history.points].sort((a, b) => {
      const tsCmp = a.ts.localeCompare(b.ts)
      if (tsCmp !== 0) return tsCmp
      return (order.get(a.vendor) ?? 999) - (order.get(b.vendor) ?? 999)
    })
  }, [props.history])

  const spec = useMemo(() => {
    if (orderedPoints.length === 0) return null
    return {
      type: 'bar' as const,
      data: [{ id: 'vendor-share', values: orderedPoints }],
      xField: 'label',
      yField: 'share',
      seriesField: 'vendor',
      stack: true,
      paddingInner: 0.12,
      legends: { visible: false },
      color: { specified: colourMap },
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
          min: 0,
          max: 1,
          label: {
            formatMethod: (val: number | string) =>
              `${Math.round(Number(val) * 100)}%`,
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
                String(datum?.vendor ?? ''),
              value: (datum: Record<string, unknown>) =>
                `${(Number(datum?.share) * 100).toFixed(1)}% · ${formatTokens(Number(datum?.tokens) || 0)}`,
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
                String(datum?.vendor ?? ''),
              value: (datum: Record<string, unknown>) =>
                Number(datum?.share) || 0,
            },
          ],
          updateContent: (
            array: Array<{ key: string; value: string | number }>
          ) => {
            return array
              .filter((item) => Number(item.value) > 0.001)
              .sort((a, b) => Number(b.value) - Number(a.value))
              .map((item) => ({
                key: item.key,
                value: `${(Number(item.value) * 100).toFixed(1)}%`,
              }))
          },
        },
      },
      animationAppear: { duration: 500 },
    }
  }, [colourMap, orderedPoints])

  const visible = props.rows.slice(0, MAX_VENDORS_IN_LIST)
  const half = Math.ceil(visible.length / 2)
  const left = visible.slice(0, half)
  const right = visible.slice(half)

  return (
    <section className='pl-card pl-card-hover'>
      <header className='border-b border-[#E5E8EE] px-6 py-5'>
        <h2 className='pl-font-display inline-flex items-center gap-2 text-[15px] font-semibold text-[#0A0E1A]'>
          <PieChart className='size-4 text-[#2E4BFF]' />
          {t('Market Share')}
        </h2>
        <p className='mt-1 text-[13px] text-[#5A6478]'>
          {t(PERIOD_DESCRIPTIONS[props.period])}
        </p>
      </header>

      <div className='px-6 pt-5 pb-2'>
        <div className='h-60 sm:h-72'>
          {spec ? (
            <VChart
              key={`vendor-share-light-${props.period}`}
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
          <h3 className='pl-font-display text-[13px] font-semibold text-[#0A0E1A]'>
            {t('By model author')}
          </h3>
          <p className='mt-0.5 text-[12px] text-[#8A93A4]'>
            {t('Vendors ranked by aggregated token volume')}
          </p>
        </header>
        {visible.length === 0 ? (
          <div className='py-8 text-center text-sm text-[#8A93A4]'>
            {t('No vendor data available')}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
            <VendorList rows={left} colourMap={colourMap} />
            {right.length > 0 && (
              <VendorList rows={right} colourMap={colourMap} />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function VendorList(props: {
  rows: VendorRanking[]
  colourMap: Record<string, string>
}) {
  return (
    <ul>
      {props.rows.map((vendor) => (
        <li key={vendor.vendor} className='flex items-center gap-3 py-2.5'>
          <span className='w-6 shrink-0 text-right pl-font-mono text-[11px] text-[#8A93A4] tabular-nums'>
            {vendor.rank}.
          </span>
          <span
            aria-hidden
            className='size-2.5 shrink-0 rounded-full'
            style={{
              backgroundColor: props.colourMap[vendor.vendor] ?? '#94a3b8',
            }}
          />
          <VendorLink
            vendor={vendor.vendor}
            className='pl-font-display min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#0A0E1A]'
          >
            {vendor.vendor}
          </VendorLink>
          <div className='shrink-0 text-right'>
            <div className='pl-font-display text-[13px] font-semibold tabular-nums text-[#0A0E1A]'>
              {formatTokens(vendor.total_tokens)}
            </div>
            <div className='pl-font-mono text-[10px] tabular-nums text-[#8A93A4]'>
              {formatShare(vendor.share)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
