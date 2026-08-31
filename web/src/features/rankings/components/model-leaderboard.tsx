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

import { getLobeIcon } from '@/lib/lobe-icon'

import { formatTokens } from '../lib/format'
import type { ModelRanking } from '../types'
import { ModelLink, VendorLink } from './entity-links'
import { GrowthText } from './growth-text'

type ModelLeaderboardProps = {
  rows: ModelRanking[]
  /** Density variant. `compact` is used inside per-category sections; the
   * default fits the larger overall "Top Models" section. */
  variant?: 'default' | 'compact'
  /** Optional cap (rows beyond this are dropped). */
  limit?: number
}

/**
 * Two-column model leaderboard list: "rank · model
 * (with vendor below) · tokens (with growth below)" rendering. Splits
 * `rows` evenly between the two columns so the visual rhythm matches a
 * single ranked list rather than two independent lists.
 *
 * Both the model name and vendor name are clickable: model jumps to
 * `/pricing/{modelName}` and vendor jumps to `/pricing?vendor={vendor}`.
 */
export function ModelLeaderboard(props: ModelLeaderboardProps) {
  const limited = props.limit ? props.rows.slice(0, props.limit) : props.rows
  const half = Math.ceil(limited.length / 2)
  const left = limited.slice(0, half)
  const right = limited.slice(half)
  const variant = props.variant ?? 'default'

  if (limited.length === 0) {
    return null
  }

  return (
    <div className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
      <ModelList rows={left} variant={variant} />
      {right.length > 0 && <ModelList rows={right} variant={variant} />}
    </div>
  )
}

function ModelList(props: {
  rows: ModelRanking[]
  variant: 'default' | 'compact'
}) {
  const { t } = useTranslation()
  const compact = props.variant === 'compact'
  return (
    <ul>
      {props.rows.map((row) => (
        <li
          key={row.model_name}
          className={
            compact
              ? 'group flex items-center gap-3 border-b border-[#E5E8EE]/60 py-2.5 last:border-b-0 transition-colors hover:bg-[#F7F8FA]/50'
              : 'group flex items-center gap-3 border-b border-[#E5E8EE]/60 py-3 last:border-b-0 transition-colors hover:bg-[#F7F8FA]/50'
          }
        >
          <span className='pl-font-mono w-7 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[#8A93A4]'>
            {row.rank}
          </span>
          <span className='shrink-0 rounded-[8px] bg-[#F7F8FA] p-1.5'>
            {getLobeIcon(row.vendor_icon, compact ? 18 : 20)}
          </span>
          <div className='min-w-0 flex-1'>
            <ModelLink
              modelName={row.model_name}
              className={
                compact
                  ? 'pl-font-mono block truncate text-[12.5px] font-medium text-[#0A0E1A]'
                  : 'pl-font-mono block truncate text-[13.5px] font-medium text-[#0A0E1A]'
              }
            >
              {row.model_name}
            </ModelLink>
            <p
              className={
                compact
                  ? 'pl-font-mono mt-0.5 truncate text-[11px] text-[#8A93A4]'
                  : 'pl-font-mono mt-0.5 truncate text-[11.5px] text-[#8A93A4]'
              }
            >
              by{' '}
              <VendorLink vendor={row.vendor} className='text-[#8A93A4] hover:text-[#0A0E1A]'>
                {row.vendor.toLowerCase()}
              </VendorLink>
            </p>
          </div>
          <div className='shrink-0 text-right'>
            <div
              className={
                compact
                  ? 'pl-font-mono text-[12.5px] font-semibold tabular-nums text-[#0A0E1A]'
                  : 'pl-font-mono text-[13.5px] font-semibold tabular-nums text-[#0A0E1A]'
              }
            >
              {formatTokens(row.total_tokens)}
              {!compact && (
                <>
                  {' '}
                  <span className='font-normal text-[#8A93A4]'>
                    {t('tokens')}
                  </span>
                </>
              )}
            </div>
            <GrowthText
              value={row.growth_pct}
              className={compact ? 'mt-0.5 text-[10px]' : 'mt-0.5 text-[11px]'}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
