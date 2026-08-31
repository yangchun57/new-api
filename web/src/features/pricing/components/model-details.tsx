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
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarClock,
  Code2,
  FileText,
  HeartPulse,
  Info,
  Layers,
  Maximize2,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { StaticDataTable } from '@/components/data-table'
import { sideDrawerContentClassName } from '@/components/drawer-layout'
import { Footer } from '@/components/layout/components/footer'
import { GroupBadge } from '@/components/group-badge'
import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getPerfMetrics } from '@/features/performance-metrics/api'
import {
  formatLatency,
  formatThroughput,
  formatUptimePct,
  getSuccessRateTextClass,
} from '@/features/performance-metrics/lib/format'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import { usePricingData } from '../hooks/use-pricing-data'
import {
  getDynamicPriceEntries,
  getDynamicPricingSummary,
  getDynamicPricingTiers,
  isDynamicPricingModel,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { getAvailableGroups, isTokenBasedModel } from '../lib/model-helpers'
import { formatFixedPrice, formatGroupPrice } from '../lib/price'
import type {
  ModelCapability,
  PriceType,
  PricingModel,
  TokenUnit,
} from '../types'
import { DynamicPricingBreakdown } from './dynamic-pricing-breakdown'
import { ModelBillingModeBadge } from './model-billing-mode-badge'
import { ModelDetailsApi } from './model-details-api'
import { ModelDetailsPerformance } from './model-details-performance'

// ----------------------------------------------------------------------------
// Local UI helpers
// ----------------------------------------------------------------------------

function SectionTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className='pl-font-mono mb-3 text-[10px] text-[#8A93A4]'>
      {props.children}
    </h2>
  )
}

const CAPABILITY_LABEL_KEYS: Record<ModelCapability, string> = {
  function_calling: 'Function calling',
  streaming: 'Streaming',
  vision: 'Vision',
  json_mode: 'JSON mode',
  structured_output: 'Structured output',
  reasoning: 'Reasoning',
  tools: 'Tools',
  system_prompt: 'System prompt',
  web_search: 'Web search',
  code_interpreter: 'Code interpreter',
  caching: 'Prompt caching',
  embeddings: 'Embeddings',
}

const MODALITY_LABEL_KEYS: Record<string, string> = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  file: 'File',
}

const TOKEN_FORMAT = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})
const MODEL_DETAILS_SKELETON_KEYS = ['first', 'second', 'third', 'fourth']

function formatCatalogTokenCount(tokens: number): string {
  if (!Number.isFinite(tokens) || tokens <= 0) return ''
  if (tokens >= 1_000_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000_000)}M`
  }
  if (tokens >= 1_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000)}K`
  }
  return TOKEN_FORMAT.format(tokens)
}

function formatCatalogYearMonth(value?: string): string {
  if (!value) return ''
  const [yearStr, monthStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return value
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short' })
}

function normalizeCatalogItems(items?: readonly string[]): string[] {
  if (!items) return []
  return items.filter((item) => item.trim().length > 0)
}

function OverviewMetric(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  const Icon = props.icon

  return (
    <div className='flex min-w-0 items-center gap-2.5 px-4 py-3'>
      <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F7F8FA]'>
        <Icon className='size-3.5 text-[#5A6478]' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='pl-font-mono truncate text-[9px] text-[#8A93A4]'>
          {props.label}
        </div>
        <div
          className={cn(
            'truncate font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]',
            props.valueClassName
          )}
        >
          {props.value}
        </div>
      </div>
    </div>
  )
}

function OverviewSummaryGrid(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const metricsQuery = useQuery({
    queryKey: ['perf-metrics', props.model.model_name],
    queryFn: () => getPerfMetrics(props.model.model_name, 24),
    staleTime: 60 * 1000,
  })

  const groups = metricsQuery.data?.data.groups ?? []
  const successRates = groups
    .map((group) => group.success_rate)
    .filter((rate) => Number.isFinite(rate))
  const successRate =
    successRates.length > 0
      ? successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length
      : Number.NaN
  const tpsValues = groups
    .map((group) => group.avg_tps)
    .filter((value) => value > 0)
  const avgTps =
    tpsValues.length > 0
      ? tpsValues.reduce((sum, value) => sum + value, 0) / tpsValues.length
      : 0
  const latencyValues = groups
    .map((group) => group.avg_latency_ms)
    .filter((value) => value > 0)
  const avgLatency =
    latencyValues.length > 0
      ? Math.round(
          latencyValues.reduce((sum, value) => sum + value, 0) /
            latencyValues.length
        )
      : 0

  return (
    <div className='pl-card grid grid-cols-1 overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-[#F0F2F6]'>
      <OverviewMetric
        icon={Timer}
        label='TPS'
        value={formatThroughput(avgTps)}
      />
      <OverviewMetric
        icon={Timer}
        label={t('Average latency')}
        value={formatLatency(avgLatency)}
      />
      <OverviewMetric
        icon={HeartPulse}
        label={t('Success rate')}
        value={formatUptimePct(successRate)}
        valueClassName={getSuccessRateTextClass(successRate)}
      />
    </div>
  )
}

function CatalogPillList(props: { items: string[] }) {
  return (
    <div className='flex min-w-0 flex-wrap gap-1.5'>
      {props.items.map((item) => (
        <span
          key={item}
          className='inline-flex items-center rounded-full border border-[#EEF0F4] bg-[#FAFBFC] px-2.5 py-0.5 text-[11px] font-medium text-[#5A6478]'
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function CatalogTextValue(props: { children: React.ReactNode }) {
  return (
    <span className='min-w-0 truncate text-[13px] font-semibold text-[#0A0E1A]'>
      {props.children}
    </span>
  )
}

function CatalogInfoCell(props: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex min-w-0 flex-col gap-1 bg-white px-4 py-3'>
      <span className='pl-font-mono text-[9px] text-[#8A93A4]'>
        {props.label}
      </span>
      {props.children}
    </div>
  )
}

function ModalityLabels(props: { items: string[] }) {
  const { t } = useTranslation()
  if (props.items.length === 0) return null

  return (
    <span className='inline-flex items-center gap-1 align-middle text-[13px] font-medium text-[#0A0E1A]'>
      {props.items.map((item) => (
        <span key={item}>{t(MODALITY_LABEL_KEYS[item] ?? item)}</span>
      ))}
    </span>
  )
}

function ModelBackendQuickStats(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const inputModalities = normalizeCatalogItems(model.input_modalities)
  const outputModalities = normalizeCatalogItems(model.output_modalities)
  const contextLength = model.context_length ?? 0
  const maxOutput = model.max_output_tokens ?? 0
  const knowledgeCutoff = formatCatalogYearMonth(model.knowledge_cutoff)
  const releaseDate = formatCatalogYearMonth(model.release_date)

  const stats: {
    key: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: React.ReactNode
    hint?: string
  }[] = []

  if (contextLength > 0) {
    stats.push({
      key: 'context',
      icon: Layers,
      label: t('Context'),
      value: formatCatalogTokenCount(contextLength),
      hint: t('Maximum input window'),
    })
  }

  if (maxOutput > 0) {
    stats.push({
      key: 'max-output',
      icon: Maximize2,
      label: t('Max output'),
      value: formatCatalogTokenCount(maxOutput),
      hint: t('Maximum tokens per response'),
    })
  }

  if (inputModalities.length > 0 || outputModalities.length > 0) {
    stats.push({
      key: 'modalities',
      icon: FileText,
      label: t('Modalities'),
      value: (
        <span className='inline-flex items-center gap-1.5'>
          <ModalityLabels items={inputModalities} />
          {inputModalities.length > 0 && outputModalities.length > 0 && (
            <span className='text-[#B8BFCC]'>→</span>
          )}
          <ModalityLabels items={outputModalities} />
        </span>
      ),
    })
  }

  if (knowledgeCutoff) {
    stats.push({
      key: 'knowledge',
      icon: Sparkles,
      label: t('Knowledge cutoff'),
      value: knowledgeCutoff,
    })
  }

  if (releaseDate) {
    stats.push({
      key: 'release',
      icon: CalendarClock,
      label: t('Released'),
      value: releaseDate,
    })
  }

  if (stats.length === 0) return null

  return (
    <div className='overflow-hidden rounded-2xl border border-[#E5E8EE] bg-[#F0F2F6] shadow-sm grid grid-cols-2 gap-px @md/details:grid-cols-3 @2xl/details:grid-cols-5'>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className='flex min-w-0 flex-col gap-0.5 bg-white px-4 py-3'
          >
            <span className='pl-font-mono inline-flex min-w-0 items-center gap-1 text-[9px] text-[#8A93A4]'>
              <Icon className='size-3 shrink-0' />
              <span className='truncate'>{stat.label}</span>
            </span>
            <span className='truncate font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
              {stat.value}
            </span>
            {stat.hint && (
              <span className='truncate text-[11px] text-[#8A93A4]'>
                {stat.hint}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ModelBackendSignalsSection(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const capabilities = normalizeCatalogItems(props.model.capabilities)
  const inputModalities = normalizeCatalogItems(props.model.input_modalities)
  const outputModalities = normalizeCatalogItems(props.model.output_modalities)

  if (
    capabilities.length === 0 &&
    inputModalities.length === 0 &&
    outputModalities.length === 0
  ) {
    return null
  }

  return (
    <section>
      <SectionTitle>
        {t('Capabilities')} / {t('Supported modalities')}
      </SectionTitle>
      <div className='pl-card grid gap-3 p-4 @2xl/details:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]'>
        {capabilities.length > 0 ? (
          <CatalogPillList
            items={capabilities.map((capability) =>
              t(
                CAPABILITY_LABEL_KEYS[capability as ModelCapability] ??
                  capability
              )
            )}
          />
        ) : (
          <div />
        )}
        {(inputModalities.length > 0 || outputModalities.length > 0) && (
          <div className='grid gap-2 sm:grid-cols-2'>
            {inputModalities.length > 0 && (
              <div className='flex items-center justify-between gap-3 rounded-full border border-[#E5E8EE] bg-[#FAFBFC] px-3 py-1.5'>
                <span className='pl-font-mono text-[9px] text-[#8A93A4]'>
                  {t('Input')}
                </span>
                <CatalogTextValue>
                  <ModalityLabels items={inputModalities} />
                </CatalogTextValue>
              </div>
            )}
            {outputModalities.length > 0 && (
              <div className='flex items-center justify-between gap-3 rounded-full border border-[#E5E8EE] bg-[#FAFBFC] px-3 py-1.5'>
                <span className='pl-font-mono text-[9px] text-[#8A93A4]'>
                  {t('Output')}
                </span>
                <CatalogTextValue>
                  <ModalityLabels items={outputModalities} />
                </CatalogTextValue>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ModelBackendProviderSection(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const groups = normalizeCatalogItems(model.enable_groups)
  const endpoints = normalizeCatalogItems(model.supported_endpoint_types)
  const tags = parseTags(model.tags)
  const cells: React.ReactNode[] = []

  if (model.vendor_name) {
    cells.push(
      <CatalogInfoCell key='provider' label={t('Provider')}>
        <CatalogTextValue>{model.vendor_name}</CatalogTextValue>
      </CatalogInfoCell>
    )
  }

  cells.push(
    <CatalogInfoCell key='type' label={t('Type')}>
      <ModelBillingModeBadge model={model} />
    </CatalogInfoCell>
  )

  if (groups.length > 0) {
    cells.push(
      <CatalogInfoCell key='groups' label={t('Groups')}>
        <CatalogPillList items={groups} />
      </CatalogInfoCell>
    )
  }

  if (endpoints.length > 0) {
    cells.push(
      <CatalogInfoCell key='endpoints' label={t('Endpoints')}>
        <CatalogPillList items={endpoints} />
      </CatalogInfoCell>
    )
  }

  if (tags.length > 0) {
    cells.push(
      <CatalogInfoCell key='tags' label={t('Tags')}>
        <CatalogPillList items={tags} />
      </CatalogInfoCell>
    )
  }

  if (model.parameter_count) {
    cells.push(
      <CatalogInfoCell key='parameters' label={t('Parameters')}>
        <CatalogTextValue>{model.parameter_count}</CatalogTextValue>
      </CatalogInfoCell>
    )
  }

  if (cells.length === 0) return null

  return (
    <section>
      <SectionTitle>{t('Model')}</SectionTitle>
      <div className='overflow-hidden rounded-2xl border border-[#E5E8EE] bg-[#F0F2F6] shadow-sm grid grid-cols-1 gap-px sm:grid-cols-2'>
        {cells}
      </div>
    </section>
  )
}

function ModelBackendDetailsSection(props: { model: PricingModel }) {
  return (
    <>
      <ModelBackendQuickStats model={props.model} />
      <ModelBackendSignalsSection model={props.model} />
      <ModelBackendProviderSection model={props.model} />
    </>
  )
}

// ----------------------------------------------------------------------------
// Model header (always visible above the detail sections)
// ----------------------------------------------------------------------------

function ModelHeader(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const modelIconKey = model.icon || model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 22) : null
  const description = model.description || model.vendor_description || null

  return (
    <header className='pb-2'>
      <div className='flex items-center gap-3'>
        {modelIcon ? (
          <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F8FA] ring-1 ring-[#E5E8EE]/60'>
            {modelIcon}
          </div>
        ) : (
          <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A0E1A] text-white pl-font-display text-[13px] font-semibold'>
            {model.model_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h1 className='truncate font-mono text-[22px] font-semibold leading-tight tracking-tight text-[#0A0E1A] sm:text-2xl'>
              {model.model_name}
            </h1>
            <CopyButton
              value={model.model_name || ''}
              className='size-6 shrink-0'
              iconClassName='size-3'
              tooltip={t('Copy model name')}
              successTooltip={t('Copied!')}
              aria-label={t('Copy model name')}
            />
          </div>
          <div className='mt-1 flex flex-wrap items-center gap-1.5 text-xs'>
            {model.vendor_name && (
              <span className='text-[12px] text-[#5A6478]'>
                {model.vendor_name}
              </span>
            )}
            {model.vendor_name && (
              <span className='text-[#B8BFCC]'>·</span>
            )}
            <ModelBillingModeBadge model={model} />
          </div>
        </div>
      </div>
      {description && (
        <p className='mt-3 text-[13px] leading-relaxed text-[#5A6478]'>
          {description}
        </p>
      )}
    </header>
  )
}

// ----------------------------------------------------------------------------
// Base price card (used in the Overview tab)
// ----------------------------------------------------------------------------

function PriceSection(props: {
  model: PricingModel
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice: boolean
}) {
  const { t } = useTranslation()
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'
  const baseGroupKey = '_base'
  const baseGroupRatioMap = { [baseGroupKey]: 1 }
  const dynamicSummary = getDynamicPricingSummary(props.model, {
    tokenUnit: props.tokenUnit,
    showRechargePrice: props.showRechargePrice,
    priceRate: props.priceRate,
    usdExchangeRate: props.usdExchangeRate,
    groupRatioMultiplier: 1,
  })

  const primaryPriceTypes: { label: string; type: PriceType }[] = [
    { label: t('Input'), type: 'input' },
    { label: t('Output'), type: 'output' },
  ]
  const secondaryPriceTypes: {
    label: string
    type: PriceType
    available: boolean
  }[] = [
    {
      label: t('Cached input'),
      type: 'cache',
      available: props.model.cache_ratio != null,
    },
    {
      label: t('Cache write'),
      type: 'create_cache',
      available: props.model.create_cache_ratio != null,
    },
    {
      label: t('Image input'),
      type: 'image',
      available: props.model.image_ratio != null,
    },
    {
      label: t('Audio input'),
      type: 'audio_input',
      available: props.model.audio_ratio != null,
    },
    {
      label: t('Audio output'),
      type: 'audio_output',
      available:
        props.model.audio_ratio != null &&
        props.model.audio_completion_ratio != null,
    },
  ]

  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      return (
        <section>
          <SectionTitle>{t('Base Price')}</SectionTitle>
          <div className='rounded-2xl border border-[#FCD34D]/60 bg-[#FEF9E7]/70 p-4'>
            <div className='text-[13px] font-medium text-[#B45309]'>
              {t('Special billing expression')}
            </div>
            <p className='mt-1 text-[12px] text-[#8A6D3B]'>
              {t('Unable to parse structured pricing')}
            </p>
            <div className='mt-3'>
              <div className='pl-font-mono mb-1.5 text-[9px] text-[#8A6D3B]'>
                {t('Raw expression')}
              </div>
              <code className='block max-h-28 overflow-auto rounded-xl border border-[#FCD34D]/40 bg-white/80 px-3 py-2 font-mono text-[11px] break-all text-[#5A6478]'>
                {dynamicSummary.rawExpression}
              </code>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section>
        <SectionTitle>{t('Base Price')}</SectionTitle>
        {dynamicSummary.primaryEntries.length > 0 ? (
          <div className='grid grid-cols-2 gap-2'>
            {dynamicSummary.primaryEntries.map((entry) => (
              <div
                key={entry.key}
                className='rounded-2xl border border-[#E5E8EE] bg-white p-4'
              >
                <div className='pl-font-mono text-[9px] text-[#8A93A4]'>
                  {t(entry.shortLabel)}
                </div>
                <div className='mt-1 font-mono text-[18px] font-semibold tabular-nums text-[#0A0E1A]'>
                  {entry.formatted}
                  <span className='ml-1 text-[11px] font-normal text-[#8A93A4]'>
                    / {tokenUnitLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-[13px] text-[#8A93A4]'>
            {t('Dynamic Pricing')}
          </p>
        )}
        {dynamicSummary.secondaryEntries.length > 0 && (
          <div className='mt-3 rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] px-4 py-3'>
            <div className='space-y-2'>
              {dynamicSummary.secondaryEntries.map((entry) => (
                <div
                  key={entry.key}
                  className='flex items-baseline justify-between gap-4'
                >
                  <span className='text-[12px] text-[#5A6478]'>
                    {t(entry.shortLabel)}
                  </span>
                  <span className='font-mono text-[13px] font-semibold tabular-nums text-[#0A0E1A]'>
                    {entry.formatted}
                    <span className='ml-1 text-[11px] font-normal text-[#8A93A4]'>
                      / {tokenUnitLabel}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    )
  }

  if (!isTokenBased) {
    return (
      <section>
        <SectionTitle>{t('Base Price')}</SectionTitle>
        <div className='flex items-baseline justify-between rounded-2xl border border-[#E5E8EE] bg-white px-4 py-3'>
          <span className='text-[13px] text-[#5A6478]'>
            {t('Per request')}
          </span>
          <span className='font-mono text-[15px] font-semibold tabular-nums text-[#0A0E1A]'>
            {formatFixedPrice(
              props.model,
              baseGroupKey,
              props.showRechargePrice,
              props.priceRate,
              props.usdExchangeRate,
              baseGroupRatioMap
            )}
          </span>
        </div>
      </section>
    )
  }

  const secondaryItems = secondaryPriceTypes.filter((p) => p.available)
  const renderPrice = (type: PriceType) => (
    <>
      {formatGroupPrice(
        props.model,
        baseGroupKey,
        type,
        props.tokenUnit,
        props.showRechargePrice,
        props.priceRate,
        props.usdExchangeRate,
        baseGroupRatioMap
      )}
      <span className='ml-1 text-[11px] font-normal text-[#8A93A4]'>
        / {tokenUnitLabel}
      </span>
    </>
  )

  return (
    <section>
      <SectionTitle>{t('Base Price')}</SectionTitle>
      <div className='grid grid-cols-2 gap-2'>
        {primaryPriceTypes.map((item) => (
          <div
            key={item.type}
            className='rounded-2xl border border-[#E5E8EE] bg-white p-4'
          >
            <div className='pl-font-mono text-[9px] text-[#8A93A4]'>
              {item.label}
            </div>
            <div className='mt-1 font-mono text-[18px] font-semibold tabular-nums text-[#0A0E1A]'>
              {renderPrice(item.type)}
            </div>
          </div>
        ))}
      </div>
      {secondaryItems.length > 0 && (
        <div className='mt-3 rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] px-4 py-3'>
          <div className='space-y-2'>
            {secondaryItems.map((item) => (
              <div
                key={item.type}
                className='flex items-baseline justify-between gap-4'
              >
                <span className='text-[12px] text-[#5A6478]'>
                  {item.label}
                </span>
                <span className='font-mono text-[13px] font-semibold tabular-nums text-[#0A0E1A]'>
                  {renderPrice(item.type)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Auto group chain (used inside group pricing section)
// ----------------------------------------------------------------------------

function AutoGroupChain(props: { model: PricingModel; autoGroups: string[] }) {
  const { t } = useTranslation()
  const modelEnableGroups = Array.isArray(props.model.enable_groups)
    ? props.model.enable_groups
    : []
  const autoChain = props.autoGroups.filter((g) =>
    modelEnableGroups.includes(g)
  )

  if (autoChain.length === 0) return null

  return (
    <div className='mb-3 flex flex-wrap items-center gap-1.5 text-xs'>
      <span className='text-[12px] font-medium text-[#5A6478]'>
        {t('Auto Group Chain')}
      </span>
      <span className='text-[#B8BFCC]'>→</span>
      {autoChain.map((g, idx) => (
        <span key={g} className='flex items-center gap-1.5'>
          <GroupBadge group={g} size='sm' />
          {idx < autoChain.length - 1 && (
            <span className='text-[#B8BFCC]'>→</span>
          )}
        </span>
      ))}
    </div>
  )
}

type DynamicPriceOptions = Parameters<typeof getDynamicPriceEntries>[1]
type DynamicPricingTier = ReturnType<typeof getDynamicPricingTiers>[number]
type DynamicFormattedPricesByTier = Map<DynamicPricingTier, Map<string, string>>

function getDynamicPriceFields(
  tiers: DynamicPricingTier[],
  options: DynamicPriceOptions
) {
  return [
    ...new Map(
      tiers
        .flatMap((tier) => getDynamicPriceEntries(tier, options))
        .map((entry) => [entry.field, entry])
    ).values(),
  ]
}

function getDynamicFormattedPricesByTier(
  tiers: DynamicPricingTier[],
  options: DynamicPriceOptions
): DynamicFormattedPricesByTier {
  return new Map(
    tiers.map((tier) => [
      tier,
      new Map(
        getDynamicPriceEntries(tier, options).map((entry) => [
          entry.field,
          entry.formatted,
        ])
      ),
    ])
  )
}

// ----------------------------------------------------------------------------
// Group pricing table
// ----------------------------------------------------------------------------

const plTh = 'pl-font-mono py-3 text-[9px] text-[#8A93A4]'
const plThRight = `${plTh} text-right`
const plCell = 'py-3 text-[13px] text-[#5A6478]'
const plCellNum =
  'py-3 text-right font-mono text-[13px] font-semibold tabular-nums text-[#0A0E1A]'

function GroupPricingSection(props: {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}) {
  const { t } = useTranslation()
  const showRechargePrice = props.showRechargePrice ?? false

  const availableGroups = useMemo(
    () => getAvailableGroups(props.model, props.usableGroup || {}),
    [props.model, props.usableGroup]
  )

  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'

  const extraPriceTypes = useMemo(() => {
    const types: { label: string; type: PriceType }[] = []
    if (props.model.cache_ratio != null) {
      types.push({ label: t('Cache'), type: 'cache' })
    }
    if (props.model.create_cache_ratio != null) {
      types.push({ label: t('Cache Write'), type: 'create_cache' })
    }
    if (props.model.image_ratio != null) {
      types.push({ label: t('Image'), type: 'image' })
    }
    if (props.model.audio_ratio != null) {
      types.push({ label: t('Audio In'), type: 'audio_input' })
    }
    if (
      props.model.audio_ratio != null &&
      props.model.audio_completion_ratio != null
    ) {
      types.push({ label: t('Audio Out'), type: 'audio_output' })
    }
    return types
  }, [props.model, t])

  if (availableGroups.length === 0) {
    return (
      <section>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
        <p className='text-[13px] text-[#8A93A4]'>
          {t(
            'This model is not available in any group, or no group pricing information is configured.'
          )}
        </p>
      </section>
    )
  }

  if (isDynamicPricingModel(props.model)) {
    const dynamicTiers = getDynamicPricingTiers(props.model)

    if (dynamicTiers.length === 0) {
      return (
        <section>
          <SectionTitle>{t('Pricing by Group')}</SectionTitle>
          <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
          <div className='rounded-2xl border border-[#FCD34D]/60 bg-[#FEF9E7]/70 p-4'>
            <div className='text-[13px] font-medium text-[#B45309]'>
              {t('Special billing expression')}
            </div>
            <p className='mt-1 text-[12px] text-[#8A6D3B]'>
              {t(
                'Group prices cannot be expanded because this expression is not a standard tiered pricing expression.'
              )}
            </p>
            <div className='mt-3'>
              <div className='pl-font-mono mb-1.5 text-[9px] text-[#8A6D3B]'>
                {t('Raw expression')}
              </div>
              <code className='block max-h-28 overflow-auto rounded-xl border border-[#FCD34D]/40 bg-white/80 px-3 py-2 font-mono text-[11px] break-all text-[#5A6478]'>
                {props.model.billing_expr}
              </code>
            </div>
          </div>
        </section>
      )
    }

    const priceFields = getDynamicPriceFields(dynamicTiers, {
      tokenUnit: props.tokenUnit,
      showRechargePrice,
      priceRate: props.priceRate,
      usdExchangeRate: props.usdExchangeRate,
      groupRatioMultiplier: 1,
    })
    const formattedPricesByGroup = new Map(
      availableGroups.map((group) => {
        const ratio = props.groupRatio[group] || 1
        return [
          group,
          getDynamicFormattedPricesByTier(dynamicTiers, {
            tokenUnit: props.tokenUnit,
            showRechargePrice,
            priceRate: props.priceRate,
            usdExchangeRate: props.usdExchangeRate,
            groupRatioMultiplier: ratio,
          }),
        ] as const
      })
    )

    return (
      <section>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
        <div className='space-y-3'>
          {availableGroups.map((group) => {
            const ratio = props.groupRatio[group] || 1
            const formattedPricesByTier =
              formattedPricesByGroup.get(group) ??
              new Map<DynamicPricingTier, Map<string, string>>()

            return (
              <div
                key={group}
                className='overflow-hidden rounded-2xl border border-[#E5E8EE] bg-white'
              >
                <div className='flex items-center justify-between gap-3 border-b border-[#F0F2F6] bg-[#FAFBFC] px-4 py-2.5'>
                  <GroupBadge group={group} size='sm' />
                  <span className='font-mono text-[12px] font-semibold tabular-nums text-[#0A0E1A]'>
                    {ratio}x
                  </span>
                </div>
                <StaticDataTable
                  className='rounded-none border-0 bg-transparent shadow-none'
                  tableClassName='text-[13px]'
                  headerRowClassName='hover:bg-transparent'
                  cellClassName='border-t border-[#F0F2F6]'
                  data={dynamicTiers}
                  getRowKey={(tier, tierIndex) =>
                    `${group}-${tier.label || tierIndex}`
                  }
                  columns={[
                    {
                      id: 'tier',
                      header: t('Tier'),
                      className: plTh,
                      cellClassName: plCell,
                      cell: (tier) => (
                        <span className='font-medium text-[#0A0E1A]'>
                          {tier.label || t('Default')}
                        </span>
                      ),
                    },
                    ...priceFields.map((fieldEntry) => ({
                      id: fieldEntry.field,
                      header: t(fieldEntry.shortLabel),
                      className: plThRight,
                      cellClassName: plCellNum,
                      cell: (tier: (typeof dynamicTiers)[number]) =>
                        formattedPricesByTier
                          .get(tier)
                          ?.get(fieldEntry.field) ?? (
                          <span className='text-[#B8BFCC]'>—</span>
                        ),
                    })),
                  ]}
                />
              </div>
            )
          })}
          <p className='mt-1.5 pl-font-mono text-[9px] text-[#B8BFCC]'>
            {t('Prices shown per')} {tokenUnitLabel} tokens
          </p>
        </div>
      </section>
    )
  }

  const renderGroupPrice = (group: string, type: PriceType) =>
    formatGroupPrice(
      props.model,
      group,
      type,
      props.tokenUnit,
      showRechargePrice,
      props.priceRate,
      props.usdExchangeRate,
      props.groupRatio
    )
  const renderFixedGroupPrice = (group: string) =>
    formatFixedPrice(
      props.model,
      group,
      showRechargePrice,
      props.priceRate,
      props.usdExchangeRate,
      props.groupRatio
    )

  return (
    <section>
      <SectionTitle>{t('Pricing by Group')}</SectionTitle>
      <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
      <StaticDataTable
        className='-mx-4 rounded-none border-0 bg-transparent shadow-none sm:mx-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-[#E5E8EE] sm:bg-white'
        tableClassName='text-[13px]'
        headerRowClassName='hover:bg-transparent sm:bg-[#FAFBFC]'
        cellClassName='border-t border-[#F0F2F6] sm:first:pl-4 sm:last:pr-4'
        data={availableGroups}
        getRowKey={(group) => group}
        columns={[
          {
            id: 'group',
            header: t('Group'),
            className: `${plTh} sm:pl-4`,
            cellClassName: `${plCell} sm:pl-4`,
            cell: (group) => <GroupBadge group={group} size='sm' />,
          },
          {
            id: 'ratio',
            header: t('Ratio'),
            className: plTh,
            cellClassName: plCell,
            cell: (group) => (
              <span className='font-mono font-semibold tabular-nums text-[#0A0E1A]'>
                {props.groupRatio[group] || 1}x
              </span>
            ),
          },
          ...(isTokenBased
            ? [
                {
                  id: 'input',
                  header: t('Input'),
                  className: plThRight,
                  cellClassName: plCellNum,
                  cell: (group: string) => renderGroupPrice(group, 'input'),
                },
                {
                  id: 'output',
                  header: t('Output'),
                  className: plThRight,
                  cellClassName: plCellNum,
                  cell: (group: string) => renderGroupPrice(group, 'output'),
                },
                ...extraPriceTypes.map((ep) => ({
                  id: ep.type,
                  header: ep.label,
                  className: plThRight,
                  cellClassName: plCellNum,
                  cell: (group: string) => renderGroupPrice(group, ep.type),
                })),
              ]
            : [
                {
                  id: 'price',
                  header: t('Price'),
                  className: plThRight,
                  cellClassName: plCellNum,
                  cell: renderFixedGroupPrice,
                },
              ]),
        ]}
      />
      <div className='-mx-4 sm:mx-0'>
        {isTokenBased && (
          <p className='mt-1.5 px-4 pl-font-mono text-[9px] text-[#B8BFCC] sm:px-0'>
            {t('Prices shown per')} {tokenUnitLabel} tokens
          </p>
        )}
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------------------

const TAB_VALUES = ['overview', 'performance', 'api'] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_META: Record<
  TabValue,
  { icon: React.ComponentType<{ className?: string }>; labelKey: string }
> = {
  overview: { icon: Info, labelKey: 'Overview' },
  performance: { icon: HeartPulse, labelKey: 'Performance' },
  api: { icon: Code2, labelKey: 'API' },
}

export interface ModelDetailsContentProps {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  endpointMap: Record<string, { path?: string; method?: string }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}

export function ModelDetailsContent(props: ModelDetailsContentProps) {
  const { t } = useTranslation()
  const showRechargePrice = props.showRechargePrice ?? false

  const isDynamic =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)

  return (
    <div className='@container/details space-y-5'>
      <ModelHeader model={props.model} />

      <Tabs defaultValue='overview' className='gap-5'>
        <TabsList className='inline-flex h-auto w-full gap-0.5 rounded-full bg-[#F7F8FA] p-1'>
          {TAB_VALUES.map((value) => {
            const Icon = TAB_META[value].icon
            return (
              <TabsTrigger
                key={value}
                value={value}
                className='h-9 min-w-0 flex-1 gap-1.5 rounded-full pl-font-display text-[12px] font-semibold tracking-wide data-[state=active]:bg-[#0A0E1A] data-[state=active]:text-white data-[state=active]:shadow-sm'
              >
                <Icon className='size-3.5' />
                <span className='truncate'>{t(TAB_META[value].labelKey)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value='overview' className='space-y-6 outline-none'>
          <OverviewSummaryGrid model={props.model} />

          <div className='space-y-6 rounded-2xl border border-[#E5E8EE] bg-white p-5 shadow-sm'>
            <SectionTitle>{t('Pricing')}</SectionTitle>
            <PriceSection
              model={props.model}
              priceRate={props.priceRate}
              usdExchangeRate={props.usdExchangeRate}
              tokenUnit={props.tokenUnit}
              showRechargePrice={showRechargePrice}
            />
            {isDynamic && (
              <DynamicPricingBreakdown billingExpr={props.model.billing_expr} />
            )}
            <GroupPricingSection
              model={props.model}
              groupRatio={props.groupRatio}
              usableGroup={props.usableGroup}
              autoGroups={props.autoGroups}
              priceRate={props.priceRate}
              usdExchangeRate={props.usdExchangeRate}
              tokenUnit={props.tokenUnit}
              showRechargePrice={showRechargePrice}
            />
          </div>

          <ModelBackendDetailsSection model={props.model} />
        </TabsContent>

        <TabsContent value='performance' className='outline-none'>
          <ModelDetailsPerformance model={props.model} />
        </TabsContent>

        <TabsContent value='api' className='outline-none'>
          <ModelDetailsApi
            model={props.model}
            endpointMap={props.endpointMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Drawer & page wrappers
// ----------------------------------------------------------------------------

export interface ModelDetailsDrawerProps extends ModelDetailsContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelDetailsDrawer(props: ModelDetailsDrawerProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, ...contentProps } = props

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className={sideDrawerContentClassName(
          'sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl'
        )}
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>{props.model.model_name}</SheetTitle>
          <SheetDescription>{t('Model details')}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 pt-11 pb-5 sm:px-6 sm:pt-12 sm:pb-6'>
          <ModelDetailsContent {...contentProps} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ModelDetails() {
  const { t } = useTranslation()
  const { modelId } = useParams({ from: '/pricing/$modelId/' })
  const search = useSearch({ from: '/pricing/$modelId/' })
  const navigate = useNavigate()

  const {
    models,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const tokenUnit: TokenUnit =
    search.tokenUnit === 'K' ? 'K' : DEFAULT_TOKEN_UNIT

  const model = useMemo(() => {
    if (!models || !modelId) return null
    return models.find((m) => m.model_name === modelId) || null
  }, [models, modelId])

  const handleBack = () => {
    navigate({ to: '/pricing', search })
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-5xl px-4 pb-20 sm:px-6'>
          <div className='h-4 w-16 animate-pulse rounded-full bg-[#F0F2F6]' />
          <div className='mt-5 flex items-center gap-3'>
            <div className='size-11 animate-pulse rounded-2xl bg-[#F0F2F6]' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-6 w-64 rounded-full bg-[#F0F2F6]' />
              <Skeleton className='h-4 w-40 rounded-full bg-[#F0F2F6]' />
            </div>
          </div>
          <div className='mt-5 h-10 animate-pulse rounded-full bg-[#F0F2F6]' />
          <div className='mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-[#F0F2F6] sm:grid-cols-3'>
            {MODEL_DETAILS_SKELETON_KEYS.map((key) => (
              <div
                key={`metric-${key}`}
                className='h-20 animate-pulse bg-white'
              />
            ))}
          </div>
          <div className='mt-6 space-y-3'>
            {MODEL_DETAILS_SKELETON_KEYS.map((key) => (
              <Skeleton
                key={`section-${key}`}
                className='h-24 w-full rounded-2xl bg-[#F0F2F6]'
              />
            ))}
          </div>
        </div>
        <Footer />
      </PublicLayout>
    )
  }

  if (!model) {
    return (
      <PublicLayout>
        <div className='mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 pb-20 text-center sm:px-6'>
          <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-[#F7F8FA]'>
            <Info className='size-6 text-[#5A6478]' />
          </div>
          <h2 className='mb-1 pl-font-display text-[18px] font-semibold text-[#0A0E1A]'>
            {t('Model not found')}
          </h2>
          <p className='mb-5 text-[13px] text-[#8A93A4]'>
            {t("The model you're looking for doesn't exist.")}
          </p>
          <Button
            onClick={handleBack}
            className='h-9 rounded-full bg-[#0A0E1A] pl-font-display text-[12px] font-semibold text-white hover:bg-[#0A0E1A]/90'
          >
            <ArrowLeft className='size-3.5' />
            {t('Back to Models')}
          </Button>
        </div>
        <Footer />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10'>
        <button
          onClick={handleBack}
          className='mb-5 inline-flex items-center gap-1 rounded-full px-2 py-1 pl-font-display text-[11px] font-semibold tracking-wide text-[#8A93A4] transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
        >
          <ArrowLeft className='size-3' />
          {t('Back')}
        </button>

        <ModelDetailsContent
          model={model}
          groupRatio={groupRatio || {}}
          usableGroup={usableGroup || {}}
          autoGroups={autoGroups || []}
          priceRate={priceRate ?? 1}
          usdExchangeRate={usdExchangeRate ?? 1}
          tokenUnit={tokenUnit}
          showRechargePrice={search.rechargePrice ?? false}
          endpointMap={
            (endpointMap as Record<
              string,
              { path?: string; method?: string }
            >) || {}
          }
        />
      </div>
      <Footer />
    </PublicLayout>
  )
}
