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
import { ChevronRight, Copy } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { isTokenBasedModel } from '../lib/model-helpers'
import { formatPrice, formatRequestPrice } from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import { ModelBillingModeBadge } from './model-billing-mode-badge'
import { ModelPerfBadge, type ModelPerfBadgeData } from './model-perf-badge'

export interface ModelCardProps {
  model: PricingModel
  onClick: () => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  perf?: ModelPerfBadgeData
}

export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const tags = parseTags(props.model.tags)
  const groups = props.model.enable_groups || []
  const endpoints = props.model.supported_endpoint_types || []
  const modelIconKey = props.model.icon || props.model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 28) : null
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'
  const isDynamicPricing =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const hasCachedPrice = isTokenBased && props.model.cache_ratio != null
  const dynamicSummary = isDynamicPricing
    ? getDynamicPricingSummary(props.model, {
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate,
        groupRatioMultiplier: getDynamicDisplayGroupRatio(
          props.model,
          props.selectedGroup
        ),
      })
    : null

  const primaryGroup = groups[0]
  const bottomTags = [...endpoints.slice(0, 2), ...tags.slice(0, 2)]
  const hiddenCount =
    Math.max(groups.length - 1, 0) +
    Math.max(endpoints.length - 2, 0) +
    Math.max(tags.length - 2, 0)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyToClipboard(props.model.model_name || '')
  }

  const handleCardClick = () => {
    props.onClick()
  }

  let priceSummary: ReactNode
  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      priceSummary = (
        <span className='min-w-0'>
          <span className='text-[#B45309]'>
            {t('Special billing expression')}
          </span>
          <code className='mt-0.5 line-clamp-1 block font-mono text-[11px] break-all text-[#8A93A4]'>
            {dynamicSummary.rawExpression}
          </code>
        </span>
      )
    } else if (dynamicSummary.primaryEntries.length > 0) {
      priceSummary = (
        <>
          {dynamicSummary.primaryEntries.map((entry) => (
            <span
              key={entry.key}
              className='whitespace-nowrap text-[12px] text-[#5A6478]'
            >
              {t(entry.shortLabel)}{' '}
              <span className='font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
                {entry.formatted}
              </span>
            </span>
          ))}
        </>
      )
    } else {
      priceSummary = (
        <span className='text-[13px] text-[#5A6478]'>
          {t('Dynamic Pricing')}
        </span>
      )
    }
  } else if (isTokenBased) {
    priceSummary = (
      <>
        <span className='whitespace-nowrap text-[12px] text-[#5A6478]'>
          {t('Input')}{' '}
          <span className='font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
            {formatPrice(
              props.model,
              'input',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate,
              props.selectedGroup
            )}
          </span>
        </span>
        <span className='whitespace-nowrap text-[12px] text-[#5A6478]'>
          {t('Output')}{' '}
          <span className='font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
            {formatPrice(
              props.model,
              'output',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate,
              props.selectedGroup
            )}
          </span>
        </span>
        {hasCachedPrice && (
          <span className='whitespace-nowrap text-[12px] text-[#5A6478]'>
            {t('Cached')}{' '}
            <span className='font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
              {formatPrice(
                props.model,
                'cache',
                tokenUnit,
                showRechargePrice,
                priceRate,
                usdExchangeRate,
                props.selectedGroup
              )}
            </span>
          </span>
        )}
      </>
    )
  } else {
    priceSummary = (
      <span className='whitespace-nowrap text-[12px] text-[#5A6478]'>
        <span className='font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
          {formatRequestPrice(
            props.model,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        </span>{' '}
        / {t('request')}
      </span>
    )
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex cursor-pointer flex-col p-4 sm:p-5',
        'pl-card pl-card-hover'
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F7F8FA] sm:size-11'>
            {modelIcon || (
              <span className='font-mono text-[14px] font-semibold text-[#5A6478]'>
                {initial}
              </span>
            )}
          </div>
          <div className='min-w-0'>
            <h3 className='truncate font-mono text-[15px] leading-tight font-semibold tracking-tight text-[#0A0E1A]'>
              {props.model.model_name}
            </h3>
            <div className='mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5'>
              {priceSummary}
            </div>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              props.onClick()
            }}
            className='pl-cta-primary inline-flex items-center gap-0.5 rounded-full bg-[#0A0E1A] px-3 py-1.5 pl-font-display text-[11px] font-semibold text-white transition-colors'
          >
            {t('Details')}
            <ChevronRight className='size-3' />
          </button>
          <button
            type='button'
            onClick={handleCopy}
            className='inline-flex size-7 items-center justify-center rounded-full text-[#8A93A4] transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
            title={t('Copy')}
          >
            <Copy className='size-3.5' />
          </button>
        </div>
      </div>

      <p className='mt-3 line-clamp-1 flex-1 text-[13px] leading-relaxed text-[#5A6478] sm:mt-4 sm:line-clamp-2 sm:min-h-[2.5rem]'>
        {props.model.description || t('No description available.')}
      </p>

      <div className='mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 sm:mt-4'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
          {primaryGroup && (
            <span className='text-[13px] font-medium text-[#0A0E1A]'>
              {primaryGroup}
            </span>
          )}
          <ModelBillingModeBadge model={props.model} />
        </div>
        <ModelPerfBadge perf={props.perf} className='row-span-2 self-start' />

        <div className='flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 sm:gap-x-3'>
          {bottomTags.map((item) => (
            <span
              key={item}
              className='rounded-full border border-[#EEF0F4] bg-[#FAFBFC] px-2 py-0.5 text-[11px] text-[#5A6478]'
            >
              {item}
            </span>
          ))}
          <span className='pl-font-mono text-[10px] font-medium text-[#8A93A4]'>
            {tokenUnitLabel}
          </span>
          {hiddenCount > 0 && (
            <span className='pl-font-mono text-[10px] font-medium text-[#B8BFCC]'>
              +{hiddenCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
