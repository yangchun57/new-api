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
import { Tag as TagIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { StaticDataTable } from '@/components/data-table'
import { cn } from '@/lib/utils'
import { useSystemConfigStore } from '@/stores/system-config-store'

import {
  BILLING_PRICING_VARS,
  MATCH_CONTAINS,
  MATCH_EQ,
  MATCH_EXISTS,
  MATCH_GTE,
  MATCH_LT,
  MATCH_RANGE,
  SOURCE_TIME,
  normalizeTierLabel,
  parseTiersFromExpr,
  requestRuleGroupsFromTrace,
  splitBillingExprAndRequestRules,
  tryParseRequestRuleExpr,
  type ParsedTier,
  type RequestCondition,
  type RequestRuleGroup,
  type RequestRuleTrace,
  type TierCondition,
} from '../lib/billing-expr'

type DynamicPricingBreakdownProps = {
  billingExpr: string | null | undefined
  matchedTierLabel?: string | null
  requestRules?: RequestRuleTrace[] | null
  hideCacheColumns?: boolean
  compact?: boolean
}

const VAR_LABELS: Record<string, string> = {
  p: 'Input',
  c: 'Output',
  len: 'Length',
}
const OP_LABELS: Record<string, string> = {
  '<': '<',
  '<=': '≤',
  '>': '>',
  '>=': '≥',
}
const TIME_FUNC_LABELS: Record<string, string> = {
  hour: 'Hour',
  minute: 'Minute',
  weekday: 'Weekday',
  month: 'Month',
  day: 'Day',
}

function formatTokenHint(value: string | number): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return ''
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
  }
  return String(n)
}

function formatConditionSummary(
  conditions: TierCondition[],
  t: (key: string) => string
): string {
  return conditions
    .map((c) => {
      const varLabel = t(VAR_LABELS[c.var] || c.var)
      const hint = formatTokenHint(c.value)
      return `${varLabel} ${OP_LABELS[c.op] || c.op} ${hint || c.value}`
    })
    .filter(Boolean)
    .join(' && ')
}

function describeCondition(
  cond: RequestCondition,
  t: (key: string) => string
): string {
  if (cond.source === SOURCE_TIME) {
    const fn = t(TIME_FUNC_LABELS[cond.timeFunc] || cond.timeFunc)
    const tz = cond.timezone || 'UTC'
    if (cond.mode === MATCH_RANGE) {
      return `${fn} ${cond.rangeStart}:00~${cond.rangeEnd}:00 (${tz})`
    }
    const opMap: Record<string, string> = {
      [MATCH_EQ]: '=',
      [MATCH_GTE]: '≥',
      [MATCH_LT]: '<',
    }
    return `${fn} ${opMap[cond.mode] || '='} ${cond.value} (${tz})`
  }
  const src = cond.source === 'header' ? t('Header') : t('Body param')
  const path = cond.path || ''
  if (cond.mode === MATCH_EXISTS) return `${src} ${path} ${t('Exists')}`
  if (cond.mode === MATCH_CONTAINS) {
    return `${src} ${path} ${t('Contains')} "${cond.value}"`
  }
  const opMap: Record<string, string> = {
    eq: '=',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
  }
  return `${src} ${path} ${opMap[cond.mode] || '='} ${cond.value}`
}

function describeGroup(
  group: RequestRuleGroup,
  t: (key: string) => string
): string {
  const description = (group.conditions || [])
    .map((condition) => describeCondition(condition, t))
    .join(' && ')
  return description || group.conditionText || ''
}

function nextOccurrenceKey(
  baseKey: string,
  occurrences: Map<string, number>
): string {
  const occurrence = occurrences.get(baseKey) || 0
  occurrences.set(baseKey, occurrence + 1)
  return `${baseKey}:${occurrence}`
}

function TierBadge({
  label,
  compact,
}: {
  label: string
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[#EEF0F4] bg-[#FAFBFC] font-mono text-[#5A6478]',
        compact ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]'
      )}
    >
      {label}
    </span>
  )
}

function MatchedBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-emerald-50 font-medium text-emerald-700 ring-1 ring-emerald-200',
        compact ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]'
      )}
    >
      {compact ? '✓' : 'Matched'}
    </span>
  )
}

function MultiplierBadge({
  multiplier,
  matched,
  matchedText,
}: {
  multiplier: number
  matched?: boolean
  matchedText?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        matched
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'border border-[#FCD34D]/60 bg-[#FEF9E7] text-[#B45309]'
      )}
    >
      {multiplier}x{matched && matchedText ? ` · ${matchedText}` : ''}
    </span>
  )
}

const RAW_CODE_BASE =
  'block break-all rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] p-3 font-mono text-[12px] leading-relaxed text-[#5A6478]'

export function DynamicPricingBreakdown({
  billingExpr,
  matchedTierLabel,
  requestRules,
  hideCacheColumns = false,
  compact = false,
}: DynamicPricingBreakdownProps) {
  const { t } = useTranslation()
  const expr = billingExpr || ''
  const currency = useSystemConfigStore((s) => s.config.currency)

  const { symbol, rate } = useMemo(() => {
    if (currency.quotaDisplayType === 'CNY') {
      return { symbol: '¥', rate: currency.usdExchangeRate || 7 }
    }
    if (currency.quotaDisplayType === 'CUSTOM') {
      return {
        symbol: currency.customCurrencySymbol || '¤',
        rate: currency.customCurrencyExchangeRate || 1,
      }
    }
    return { symbol: '$', rate: 1 }
  }, [currency])

  const { tiers, ruleGroups } = useMemo(() => {
    const split = splitBillingExprAndRequestRules(expr)
    const parsedTiers = parseTiersFromExpr(split.billingExpr)
    const parsedRules =
      requestRules != null
        ? requestRuleGroupsFromTrace(requestRules)
        : tryParseRequestRuleExpr(split.requestRuleExpr || '')
    return {
      tiers: parsedTiers,
      ruleGroups: parsedRules || [],
    }
  }, [expr, requestRules])

  const hasTiers = tiers.length > 0
  const hasRules = ruleGroups.length > 0
  const normalizedMatchedTierLabel = normalizeTierLabel(
    matchedTierLabel ?? undefined
  )

  if (!expr) return null

  if (!hasTiers) {
    return (
      <section className={cn('min-w-0', !compact && 'py-4')}>
        {!compact && (
          <div className='mb-3 flex items-center gap-2'>
            <span className='inline-flex size-7 items-center justify-center rounded-full bg-[#FEF9E7] text-[#B45309] ring-1 ring-[#FCD34D]/50'>
              <TagIcon className='size-3.5' />
            </span>
            <div>
              <div className='text-[14px] font-semibold text-[#0A0E1A]'>
                {t('Special billing expression')}
              </div>
              <div className='mt-0.5 text-[12px] text-[#8A93A4]'>
                {t('Unable to parse structured pricing')}
              </div>
            </div>
          </div>
        )}
        <div className='mb-1.5 pl-font-mono text-[10px] text-[#8A93A4]'>
          {t('Raw expression')}
        </div>
        <code className={RAW_CODE_BASE}>{expr}</code>
      </section>
    )
  }

  const visiblePriceFields = BILLING_PRICING_VARS.filter((v) => {
    if (!hasTiers) return false
    if (hideCacheColumns && v.group === 'cache') return false
    return tiers.some(
      (tier) => Number(tier[v.field as string as keyof ParsedTier] || 0) > 0
    )
  })
  const mobileTierKeyOccurrences = new Map<string, number>()
  const requestRuleKeyOccurrences = new Map<string, number>()

  const sectionLabel = compact
    ? 'mb-1 text-[11px] font-medium text-[#8A93A4]'
    : 'mb-2 text-[13px] font-semibold text-[#0A0E1A]'

  const thBase = compact
    ? 'h-8 py-2 text-[11px] text-[#8A93A4]'
    : 'py-3 pl-font-mono text-[9px] text-[#8A93A4]'
  const thLeft = thBase + ' text-left font-medium'
  const thRight = thBase + ' text-right font-medium'
  const cellBase = compact ? 'py-2 text-[12px]' : 'py-3 text-[13px]'
  const cellLeft = cellBase + ' text-[#5A6478]'
  const cellNum =
    cellBase +
    ' text-right font-mono tabular-nums text-[#0A0E1A]' +
    (compact ? '' : ' font-semibold')
  const condClass = compact
    ? 'mt-0.5 text-[11px] text-[#8A93A4]'
    : 'mt-1 text-[12px] text-[#8A93A4]'
  const dividerClass = compact ? 'border-t border-[#F0F2F6]' : 'border-t border-[#F0F2F6]'

  return (
    <section className={cn('min-w-0', !compact && 'py-3 sm:py-4')}>
      {!compact && (
        <div className='mb-4 flex items-start gap-2'>
          <span className='mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-[#FEF9E7] text-[#B45309] ring-1 ring-[#FCD34D]/50'>
            <TagIcon className='size-3.5' />
          </span>
          <div>
            <div className='text-[14px] font-semibold text-[#0A0E1A]'>
              {t('Dynamic Pricing')}
            </div>
            <div className='mt-0.5 text-[12px] text-[#8A93A4]'>
              {t('Prices vary by usage tier and request conditions')}
            </div>
          </div>
        </div>
      )}

      {hasTiers && (
        <div className={cn(!compact && 'mb-4', compact && hasRules && 'mb-3')}>
          <div className={sectionLabel}>{t('Tiered price table')}</div>
          <div className='space-y-2 sm:hidden'>
            {tiers.map((tier) => {
              const condSummary = formatConditionSummary(tier.conditions, t)
              const isMatched =
                matchedTierLabel != null &&
                matchedTierLabel !== '' &&
                tier.label === matchedTierLabel
              const rowKey = nextOccurrenceKey(
                JSON.stringify(tier),
                mobileTierKeyOccurrences
              )
              return (
                <div
                  key={`tier-mobile-${rowKey}`}
                  className={cn(
                    'rounded-xl border p-3',
                    isMatched
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-[#E5E8EE] bg-white'
                  )}
                >
                  <div className='mb-2 flex flex-wrap items-center gap-1.5'>
                    <TierBadge label={tier.label || t('Default')} compact={compact} />
                    {isMatched && <MatchedBadge compact={compact} />}
                  </div>
                  {condSummary && (
                    <div
                      className={cn(
                        'mb-2 text-[12px] text-[#8A93A4]',
                        compact && 'text-[11px]'
                      )}
                    >
                      {condSummary}
                    </div>
                  )}
                  <div className='grid grid-cols-2 gap-x-3 gap-y-1.5'>
                    {visiblePriceFields.map((v) => {
                      const value = Number(
                        tier[v.field as string as keyof ParsedTier] || 0
                      )
                      return (
                        <div key={v.field} className='min-w-0'>
                          <div className='truncate pl-font-mono text-[9px] text-[#8A93A4]'>
                            {t(v.shortLabel)}
                          </div>
                          <div
                            className={cn(
                              'truncate font-mono tabular-nums text-[#0A0E1A]',
                              compact ? 'text-[12px]' : 'text-[13px] font-semibold'
                            )}
                          >
                            {value > 0
                              ? `${symbol}${(value * rate).toFixed(4)}`
                              : <span className='text-[#B8BFCC]'>–</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <StaticDataTable
            className={cn(
              'hidden overflow-hidden sm:block',
              compact
                ? ''
                : 'rounded-2xl border border-[#E5E8EE] bg-white shadow-sm'
            )}
            tableClassName={
              compact
                ? '[&_td]:text-[12px] [&_th]:text-[11px]'
                : 'text-[13px]'
            }
            headerRowClassName={
              compact ? 'hover:bg-transparent' : 'bg-[#FAFBFC] hover:bg-transparent'
            }
            data={tiers}
            getRowKey={(_tier, index) => `tier-${index}`}
            getRowClassName={(tier) => {
              const isMatched =
                normalizedMatchedTierLabel !== '' &&
                normalizeTierLabel(tier.label) === normalizedMatchedTierLabel
              return isMatched ? 'bg-emerald-50/60 hover:bg-emerald-50/60' : ''
            }}
            columns={[
              {
                id: 'tier',
                header: t('Tier'),
                className: thLeft,
                cellClassName: cn(cellLeft + ' align-top', dividerClass),
                cell: (tier) => {
                  const condSummary = formatConditionSummary(tier.conditions, t)
                  const isMatched =
                    normalizedMatchedTierLabel !== '' &&
                    normalizeTierLabel(tier.label) ===
                      normalizedMatchedTierLabel
                  return (
                    <>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <TierBadge label={tier.label || t('Default')} compact={compact} />
                        {isMatched && <MatchedBadge compact={compact} />}
                      </div>
                      {condSummary && (
                        <div className={condClass}>{condSummary}</div>
                      )}
                    </>
                  )
                },
              },
              ...visiblePriceFields.map((v, index) => ({
                id: v.field ?? `price-${index}`,
                header: t(v.shortLabel),
                className: thRight,
                cellClassName: cn(cellNum + ' align-top', dividerClass),
                cell: (tier: ParsedTier) => {
                  const value = Number(
                    tier[v.field as string as keyof ParsedTier] || 0
                  )
                  return value > 0 ? (
                    `${symbol}${(value * rate).toFixed(4)}`
                  ) : (
                    <span className='text-[#B8BFCC]'>–</span>
                  )
                },
              })),
            ]}
          />
        </div>
      )}

      {hasRules && (
        <div>
          <div className={sectionLabel}>{t('Conditional multipliers')}</div>
          <ul className='space-y-1.5'>
            {ruleGroups.map((group) => {
              const isMatched = group.matched === true
              const rowKey = nextOccurrenceKey(
                `${group.conditionText || JSON.stringify(group.conditions)}:${group.multiplier}`,
                requestRuleKeyOccurrences
              )
              return (
                <li
                  key={`group-${rowKey}`}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-3 py-2',
                    isMatched
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : compact
                        ? 'border-[#EEF0F4] bg-[#FAFBFC]'
                        : 'border-[#E5E8EE] bg-[#FAFBFC]'
                  )}
                >
                  <span
                    className={cn(
                      'break-all text-[#5A6478]',
                      compact ? 'text-[12px]' : 'text-[13px]'
                    )}
                  >
                    {describeGroup(group, t)}
                  </span>
                  <MultiplierBadge
                    multiplier={group.multiplier}
                    matched={isMatched}
                    matchedText={t('Matched')}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
