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
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import type { RankingMover } from '../types'
import { ModelLink, VendorLink } from './entity-links'

type PulseSectionProps = {
  movers: RankingMover[]
  droppers: RankingMover[]
}

/**
 * Rank movement panel: gainers and losers calculated from the previous period.
 */
export function PulseSection(props: PulseSectionProps) {
  const { t } = useTranslation()

  return (
    <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <PulseCard
        title={t('Trending up')}
        description={t('Models climbing the leaderboard')}
        icon={<TrendingUp className='size-4 text-[#22C55E]' />}
      >
        {props.movers.length === 0 ? (
          <PulseEmpty label={t('No notable climbers right now')} />
        ) : (
          <ul>
            {props.movers.map((row) => (
              <MoverRow key={row.model_name} row={row} intent='up' />
            ))}
          </ul>
        )}
      </PulseCard>

      <PulseCard
        title={t('Trending down')}
        description={t('Models losing positions')}
        icon={<TrendingDown className='size-4 text-[#E54D4D]' />}
      >
        {props.droppers.length === 0 ? (
          <PulseEmpty label={t('No notable drops right now')} />
        ) : (
          <ul>
            {props.droppers.map((row) => (
              <MoverRow key={row.model_name} row={row} intent='down' />
            ))}
          </ul>
        )}
      </PulseCard>
    </section>
  )
}

function PulseCard(props: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='pl-card pl-card-hover overflow-hidden'>
      <header className='px-5 py-4'>
        <h3 className='pl-font-display inline-flex items-center gap-2 text-[14px] font-semibold tracking-tight text-[#0A0E1A]'>
          {props.icon}
          {props.title}
        </h3>
        <p className='mt-0.5 text-[12px] leading-snug text-[#5A6478]'>
          {props.description}
        </p>
      </header>
      <div className='border-t border-[#E5E8EE] py-1'>{props.children}</div>
    </div>
  )
}

function PulseEmpty(props: { label: string }) {
  return (
    <div className='px-5 py-8 text-center pl-font-mono text-[12px] text-[#8A93A4]'>
      {props.label}
    </div>
  )
}

function MoverRow(props: { row: RankingMover; intent: 'up' | 'down' }) {
  return (
    <li className='flex items-center gap-3 border-b border-[#E5E8EE]/60 px-5 py-2.5 last:border-b-0 transition-colors hover:bg-[#F7F8FA]/60'>
      <span className='shrink-0 rounded-[8px] bg-[#F7F8FA] p-1.5'>
        {getLobeIcon(props.row.vendor_icon, 20)}
      </span>
      <div className='min-w-0 flex-1'>
        <ModelLink
          modelName={props.row.model_name}
          className='pl-font-mono block truncate text-[12.5px] font-medium text-[#0A0E1A]'
        >
          {props.row.model_name}
        </ModelLink>
        <p className='pl-font-mono mt-0.5 truncate text-[11px] text-[#8A93A4]'>
          <span className='text-[#5A6478]'>#{props.row.current_rank}</span>
          <span className='mx-1.5 text-[#CBD3E0]'>·</span>
          <VendorLink vendor={props.row.vendor} className='text-[#8A93A4] hover:text-[#0A0E1A]'>
            {props.row.vendor.toLowerCase()}
          </VendorLink>
        </p>
      </div>
      <span
        className={cn(
          'pl-font-mono inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums',
          props.intent === 'up'
            ? 'bg-[#E8FBF0] text-[#16A34A]'
            : 'bg-[#FEECEC] text-[#C93838]'
        )}
      >
        {props.intent === 'up' ? (
          <ArrowUpRight className='size-3' />
        ) : (
          <ArrowDownRight className='size-3' />
        )}
        {Math.abs(props.row.rank_delta)}
      </span>
    </li>
  )
}
