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
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Trophy,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { StaticDataTable } from '@/components/data-table'
import { cn } from '@/lib/utils'

import {
  buildAppRankings,
  formatTokenVolume,
  type AppRanking,
} from '../lib/mock-stats'
import type { PricingModel } from '../types'

const COMPACT_NUMBER = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const thBase =
  'pl-font-mono h-9 px-3 text-left text-[9px] font-medium text-[#8A93A4]'
const thRight = cn(thBase, 'text-right')
const cellBase =
  'border-t border-[#F0F2F6] px-3 py-2.5 text-[13px] text-[#0A0E1A]'
const cellRight = cn(cellBase, 'text-right')
const cellMuted = cn(cellBase, 'text-[#5A6478]')

function RankBadge({ rank }: { rank: number }) {
  const isPodium = rank <= 3
  const palette =
    rank === 1
      ? 'bg-[#FEF9E7] text-[#B45309] ring-1 ring-[#FCD34D]/50'
      : rank === 2
        ? 'bg-[#F0F2F6] text-[#5A6478] ring-1 ring-[#E5E8EE]'
        : rank === 3
          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
          : 'bg-[#F7F8FA] text-[#5A6478]'
  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold tabular-nums',
        palette
      )}
    >
      {isPodium ? <Trophy className='size-3.5' /> : rank}
    </span>
  )
}

function GrowthChip({ value }: { value: number }) {
  const isUp = value > 0
  const isDown = value < 0
  const palette = isUp
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : isDown
      ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
      : 'bg-[#F7F8FA] text-[#8A93A4]'
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : null
  const formatted = `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
        palette
      )}
    >
      {Icon && <Icon className='size-3' />}
      {formatted}
    </span>
  )
}

function AppLink({ app }: { app: AppRanking }) {
  if (!app.url) {
    return <span className='text-[#0A0E1A]'>{app.name}</span>
  }
  return (
    <a
      href={app.url}
      target='_blank'
      rel='noreferrer'
      className='inline-flex items-center gap-1 text-[#0A0E1A] transition-colors hover:text-[#0A0E1A]/70'
    >
      {app.name}
      <ExternalLink className='size-3 text-[#B8BFCC]' />
    </a>
  )
}

export function ModelDetailsApps({ model }: { model: PricingModel }) {
  const { t } = useTranslation()
  const apps = useMemo(() => buildAppRankings(model, 12), [model])

  if (apps.length === 0) {
    return (
      <div className='rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] px-6 py-12 text-center text-[13px] text-[#8A93A4]'>
        {t('No app usage data available for this model.')}
      </div>
    )
  }

  const totalMonthlyTokens = apps.reduce((s, a) => s + a.monthly_tokens, 0)
  const top = apps[0]
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className='rounded-2xl border border-[#E5E8EE] bg-white p-4 shadow-sm'>
          <div className='pl-font-mono text-[9px] font-medium text-[#8A93A4]'>
            {t('Tracked apps')}
          </div>
          <div className='mt-1.5 font-mono text-[22px] font-semibold tabular-nums leading-none text-[#0A0E1A]'>
            {apps.length}
          </div>
          <p className='mt-1.5 text-[12px] leading-relaxed text-[#8A93A4]'>
            {t('Top integrations using this model')}
          </p>
        </div>
        <div className='rounded-2xl border border-[#E5E8EE] bg-white p-4 shadow-sm'>
          <div className='pl-font-mono text-[9px] font-medium text-[#8A93A4]'>
            {t('Monthly tokens')}
          </div>
          <div className='mt-1.5 font-mono text-[22px] font-semibold tabular-nums leading-none text-[#0A0E1A]'>
            {COMPACT_NUMBER.format(totalMonthlyTokens)}
          </div>
          <p className='mt-1.5 text-[12px] leading-relaxed text-[#8A93A4]'>
            {t('Aggregated across the apps below')}
          </p>
        </div>
        <div className='rounded-2xl border border-[#E5E8EE] bg-white p-4 shadow-sm'>
          <div className='pl-font-mono text-[9px] font-medium text-[#8A93A4]'>
            {t('#1 by usage')}
          </div>
          <div className='mt-1.5 truncate text-[15px] font-semibold leading-tight text-[#0A0E1A]'>
            {top.name}
          </div>
          <p className='mt-1.5 truncate text-[12px] leading-relaxed text-[#8A93A4]'>
            {top.category} · {formatTokenVolume(top.monthly_tokens)}{' '}
            {t('tokens / mo')}
          </p>
        </div>
      </div>

      <StaticDataTable
        className='overflow-hidden rounded-2xl border border-[#E5E8EE] bg-white shadow-sm'
        tableClassName='w-full'
        headerRowClassName='bg-[#FAFBFC] hover:bg-transparent'
        data={apps}
        getRowKey={(app) => `${app.rank}-${app.name}`}
        columns={[
          {
            id: 'rank',
            header: '#',
            className: cn(thBase, 'w-12'),
            cellClassName: cellBase,
            cell: (app) => <RankBadge rank={app.rank} />,
          },
          {
            id: 'app',
            header: t('App'),
            className: thBase,
            cellClassName: cellBase,
            cell: (app) => (
              <div className='flex items-center gap-3'>
                <span className='bg-[#F7F8FA] text-[#5A6478] inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold'>
                  {app.initial}
                </span>
                <div className='min-w-0'>
                  <div className='text-[13px] font-medium'>
                    <AppLink app={app} />
                  </div>
                  <p className='line-clamp-1 text-[12px] text-[#8A93A4]'>
                    {app.description}
                  </p>
                </div>
              </div>
            ),
          },
          {
            id: 'category',
            header: t('Category'),
            className: cn(thBase, 'hidden md:table-cell'),
            cellClassName: cn(cellMuted, 'hidden md:table-cell'),
            cell: (app) => app.category,
          },
          {
            id: 'monthly-tokens',
            header: t('Monthly tokens'),
            className: thRight,
            cellClassName: cn(
              cellRight,
              'font-mono font-semibold tabular-nums'
            ),
            cell: (app) => formatTokenVolume(app.monthly_tokens),
          },
          {
            id: 'growth',
            header: t('30d change'),
            className: thRight,
            cellClassName: cn(cellRight, 'text-right'),
            cell: (app) => (
              <span className='inline-flex justify-end'>
                <GrowthChip value={app.growth_pct} />
              </span>
            ),
          },
        ]}
      />

      <p className='text-[11px] leading-relaxed text-[#8A93A4]'>
        {t(
          'App rankings shown here are simulated for preview purposes and will be replaced with live usage data once the backend integration is complete.'
        )}
      </p>
    </div>
  )
}
