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
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { RankingPeriod } from '../types'

const PERIODS: { id: RankingPeriod; labelKey: string }[] = [
  { id: 'today', labelKey: 'Today' },
  { id: 'week', labelKey: 'Week' },
  { id: 'month', labelKey: 'Month' },
  { id: 'year', labelKey: 'Year' },
]

type RankingsHeroProps = {
  period: RankingPeriod
  onPeriodChange: (period: RankingPeriod) => void
}

export function RankingsHero(props: RankingsHeroProps) {
  const { t } = useTranslation()

  return (
    <section className='pl-fade-up space-y-6 pt-4'>
      {/* Title row */}
      <div className='flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-3'>
          <h1 className='pl-font-display text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] font-bold tracking-tight text-[#0A0E1A]'>
            {t('Rankings')}
          </h1>
          <p className='max-w-2xl text-[15px] leading-relaxed text-[#5A6478]'>
            {t(
              'Discover the most-used models and rising vendors on the platform, updated from live usage data.'
            )}
          </p>
        </div>

        {/* Pill tabs */}
        <div
          role='tablist'
          aria-label={t('Period')}
          className='inline-flex items-center gap-1 rounded-full border border-[#E5E8EE] bg-white p-1 pl-nav-shadow self-start md:self-auto'
        >
          {PERIODS.map((p) => {
            const isActive = props.period === p.id
            return (
              <button
                key={p.id}
                role='tab'
                type='button'
                aria-selected={isActive}
                onClick={() => props.onPeriodChange(p.id)}
                className={cn(
                  'pl-font-display relative h-8 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4BFF]/30',
                  isActive
                    ? 'bg-[#0A0E1A] text-white shadow-[0_2px_6px_rgba(10,14,26,0.15)]'
                    : 'text-[#5A6478] hover:text-[#0A0E1A]'
                )}
              >
                {t(p.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// end of file
