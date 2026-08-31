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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { Skeleton } from '@/components/ui/skeleton'

import {
  MarketShareSection,
  ModelsSection,
  PulseSection,
  RankingsHero,
} from './components'
import { useRankings } from './hooks/use-rankings'
import type { RankingPeriod } from './types'

const VALID_PERIODS: RankingPeriod[] = ['today', 'week', 'month', 'year']

export function Rankings() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/rankings/' })
  const navigate = useNavigate()

  const period: RankingPeriod = VALID_PERIODS.includes(
    search.period as RankingPeriod
  )
    ? (search.period as RankingPeriod)
    : 'week'

  const rankingsQuery = useRankings(period)
  const snapshot = rankingsQuery.data?.data

  const handlePeriodChange = (next: RankingPeriod) => {
    navigate({
      to: '/rankings',
      search: (prev) => ({ ...prev, period: next }),
    })
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#F7F8FA]'>
        {/* Background grid + glows, matching the homepage premium shell */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 pl-grid-bg opacity-80'
        />
        <div aria-hidden className='pointer-events-none absolute inset-0 pl-glow-blue' />
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 pl-glow-green'
        />

        <PageTransition className='relative z-10 mx-auto w-full max-w-[1200px] space-y-6 px-4 pt-28 pb-16 sm:px-6 lg:pt-32 lg:pb-20'>
          <RankingsHero period={period} onPeriodChange={handlePeriodChange} />

          {rankingsQuery.isLoading ? (
            <RankingsLoading />
          ) : !snapshot ? (
            <RankingsError
              message={
                rankingsQuery.error instanceof Error
                  ? rankingsQuery.error.message
                  : t('Unable to load rankings data')
              }
            />
          ) : (
            <>
              <ModelsSection
                history={snapshot.models_history}
                rows={snapshot.models}
                period={period}
              />

              <MarketShareSection
                history={snapshot.vendor_share_history}
                rows={snapshot.vendors}
                period={period}
              />

              <PulseSection
                movers={snapshot.top_movers}
                droppers={snapshot.top_droppers}
              />
            </>
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}

function RankingsLoading() {
  return (
    <div className='space-y-6'>
      <Skeleton className='pl-skeleton h-[460px] w-full rounded-[16px]' />
      <Skeleton className='pl-skeleton h-[420px] w-full rounded-[16px]' />
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Skeleton className='pl-skeleton h-[260px] w-full rounded-[16px]' />
        <Skeleton className='pl-skeleton h-[260px] w-full rounded-[16px]' />
      </div>
    </div>
  )
}

function RankingsError(props: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className='rounded-[16px] border border-[#E5E8EE] bg-white px-6 py-12 text-center pl-nav-shadow'>
      <h2 className='pl-font-display text-base font-semibold text-[#0A0E1A]'>
        {t('Unable to load rankings')}
      </h2>
      <p className='mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5A6478]'>
        {props.message}
      </p>
    </div>
  )
}
