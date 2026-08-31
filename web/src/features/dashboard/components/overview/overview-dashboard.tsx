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
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  CreditCard,
  FileText,
  KeyRound,
  ListChecks,
  RadioTower,
  ShieldCheck,
  TerminalSquare,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getUserModels } from '@/lib/api'
import { MOTION_TRANSITION } from '@/lib/motion'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  useApiInfo,
  useDashboardContentVisibility,
} from '../../hooks/use-status-data'
import { AnnouncementsPanel } from './announcements-panel'
import { ApiInfoPanel } from './api-info-panel'
import { FAQPanel } from './faq-panel'
import { PerformanceHealthPanel } from './performance-health-panel'
import { SummaryCards } from './summary-cards'
import { UptimePanel } from './uptime-panel'

const SETUP_GUIDE_VISIBILITY_STORAGE_KEY =
  'dashboard_overview_setup_guide_expanded'

const SETUP_GUIDE_CODE_PATTERN = [
  'const request = await client.responses.create({',
  "  model: 'gpt-4.1-mini',",
  "  input: 'Start routing traffic',",
  '})',
  '',
  'if (request.output_text) {',
  '  console.log(request.output_text)',
  '}',
].join('\n')

type DashboardActionPath =
  | '/keys'
  | '/wallet'
  | '/playground'
  | '/channels'
  | '/usage-logs'
  | '/pricing'

interface StartStep {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  completed: boolean
}

interface QuickAction {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  adminOnly?: boolean
}

interface RequestExample {
  endpoint: string
  model: string
  keyName: string
  keyId?: number
  displayKey: string
  ready: boolean
}

interface HeroSignal {
  label: string
  value: string
  icon: LucideIcon
  tone: IconBadgeTone
}

function getSavedSetupGuideExpanded(): boolean | null {
  if (typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(SETUP_GUIDE_VISIBILITY_STORAGE_KEY)
  if (saved === 'expanded') return true
  if (saved === 'collapsed') return false
  return null
}

function saveSetupGuideExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SETUP_GUIDE_VISIBILITY_STORAGE_KEY,
    expanded ? 'expanded' : 'collapsed'
  )
}

function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function normalizeEndpoint(sourceUrl?: string): string {
  const fallback = `${getCurrentOrigin()}/v1/chat/completions`
  const trimmed = sourceUrl?.trim()
  if (!trimmed) return fallback

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  if (withoutTrailingSlash.endsWith('/v1/chat/completions')) {
    return withoutTrailingSlash
  }
  if (withoutTrailingSlash.endsWith('/v1')) {
    return `${withoutTrailingSlash}/chat/completions`
  }
  return `${withoutTrailingSlash}/v1/chat/completions`
}

function getPreferredKey(keys: ApiKey[]): ApiKey | null {
  return keys.find((item) => item.status === 1) ?? keys[0] ?? null
}

function formatDisplayKey(key?: string): string {
  if (!key) return 'sk-...'
  if (key.length <= 14) return key
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

function buildCurlCommand(args: {
  endpoint: string
  apiKey: string
  model: string
}): string {
  return [
    `curl ${args.endpoint} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${args.apiKey}" \\`,
    `  -d '{"model":"${args.model}","messages":[{"role":"user","content":"Say hello in one sentence."}]}'`,
  ].join('\n')
}

function SetupGuideBackdrop(props: { compact?: boolean }) {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_52%_110%_at_82%_0%,rgba(46,75,255,0.10)_0%,transparent_58%),linear-gradient(112deg,#FFFFFF_0%,#F8F9FC_48%,#F3F5F9_100%)]',
          props.compact
            ? '[mask-image:linear-gradient(90deg,black_0%,black_55%,transparent_78%)] opacity-70'
            : 'opacity-100'
        )}
        aria-hidden='true'
      />
      <div
        className={cn(
          'text-[#0A0E1A]/[0.04] pointer-events-none absolute inset-y-0 right-0 hidden overflow-hidden font-mono sm:block',
          props.compact ? 'w-1/2 opacity-60' : 'w-[54%] opacity-100'
        )}
        aria-hidden='true'
      >
        <pre
          className={cn(
            'absolute right-6 [mask-image:linear-gradient(90deg,transparent_0%,black_28%,black_78%,transparent_100%)] text-right tracking-[0.42em] whitespace-pre select-none',
            props.compact
              ? 'top-0 text-[9px] leading-4'
              : 'top-2 text-[10px] leading-5'
          )}
        >
          {SETUP_GUIDE_CODE_PATTERN}
        </pre>
      </div>
      <div
        className='from-white/0 via-white/0 to-white/80 pointer-events-none absolute inset-0 bg-linear-to-b'
        aria-hidden='true'
      />
    </>
  )
}

function StartStepItem(props: {
  step: StartStep
  index: number
  isLast: boolean
}) {
  const Icon = props.step.icon
  const StatusIcon = props.step.completed ? Check : Circle

  return (
    <li className='relative flex gap-3 pb-3 last:pb-0'>
      {!props.isLast && (
        <span
          className='absolute top-9 bottom-0 left-4 w-px bg-[#E5E8EE]'
          aria-hidden='true'
        />
      )}
      <span
        className={cn(
          'bg-card relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E8EE] shadow-[0_1px_2px_rgba(10,14,26,0.04)]',
          props.step.completed && 'border-success/25 bg-success/[0.08]'
        )}
      >
        <StatusIcon
          className={props.step.completed ? 'text-success size-4' : 'text-[#B8BFCC] size-4'}
          aria-hidden='true'
        />
      </span>

      <Link
        to={props.step.to}
        className='group/step bg-white/80 hover:bg-white hover:border-[#D8DCE5] hover:shadow-[0_1px_2px_rgba(10,14,26,0.05)] focus-visible:ring-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-[#E5E8EE] px-3.5 py-3 text-left transition-all duration-150 outline-none focus-visible:ring-2'
      >
        <span className='flex min-w-0 items-start gap-3'>
          <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F8FA] text-[#5A6478]'>
            <Icon className='size-4' aria-hidden='true' />
          </span>
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='flex items-center gap-2 text-[13px] font-medium'>
              <span className='text-[#8A93A4] font-mono text-[11px] tabular-nums'>
                {props.index + 1}.
              </span>
              <span className='truncate text-[#0A0E1A]'>{props.step.title}</span>
            </span>
            <span className='text-[#8A93A4] line-clamp-1 text-[12px] leading-relaxed'>
              {props.step.description}
            </span>
          </span>
        </span>
        <ArrowRight
          className='text-[#B8BFCC] group-hover/step:text-[#0A0E1A] size-4 shrink-0 transition-colors'
          aria-hidden='true'
        />
      </Link>
    </li>
  )
}

function RequestPreview(props: {
  example: RequestExample
  signals: HeroSignal[]
}) {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  const [isCopying, setIsCopying] = useState(false)
  const { copyToClipboard } = useCopyToClipboard({ notify: false })
  const previewCurl = buildCurlCommand({
    endpoint: props.example.endpoint,
    apiKey: props.example.displayKey,
    model: props.example.model,
  })
  const previewLines = previewCurl.split('\n')
  const handleCopyRequest = async () => {
    if (!props.example.keyId || isCopying) return

    setIsCopying(true)
    try {
      const result = await fetchTokenKey(props.example.keyId)
      const key = result.success && result.data?.key ? result.data.key : ''
      if (!key) {
        toast.error(result.message || t('Failed to copy to clipboard'))
        return
      }

      const realCurl = buildCurlCommand({
        endpoint: props.example.endpoint,
        apiKey: `sk-${key}`,
        model: props.example.model,
      })
      const copied = await copyToClipboard(realCurl)
      if (copied) {
        toast.success(t('Copied to clipboard'))
      } else {
        toast.error(t('Failed to copy to clipboard'))
      }
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={MOTION_TRANSITION.slow}
      className='relative overflow-hidden rounded-xl border border-[#E5E8EE] bg-white p-4 shadow-[0_1px_2px_rgba(10,14,26,0.04)] backdrop-blur'
    >
      {!shouldReduceMotion && (
        <motion.div
          className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0A0E1A]/20 to-transparent'
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden='true'
        />
      )}

      <div className='flex items-center justify-between gap-3 border-b border-[#E5E8EE] pb-3.5'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <IconBadge tone='info' size='default'>
            <TerminalSquare />
          </IconBadge>
          <div className='min-w-0'>
            <div className='truncate text-[13px] font-semibold tracking-[-0.01em] text-[#0A0E1A]'>
              {t('First API request')}
            </div>
            <div className='text-[#8A93A4] truncate text-[12px] leading-relaxed'>
              {props.example.ready
                ? props.example.keyName
                : t('Create an API key to unlock the real request')}
            </div>
          </div>
        </div>
        {props.example.ready ? (
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 px-2.5 text-[12px]'
            disabled={isCopying}
            onClick={handleCopyRequest}
            aria-label={t('Copy ready-to-run curl')}
          >
            <Copy data-icon='inline-start' className='size-3.5' />
            {isCopying ? t('Loading') : t('Copy')}
          </Button>
        ) : (
          <Button size='sm' variant='outline' render={<Link to='/keys' />}>
            {t('Create API Key')}
          </Button>
        )}
      </div>

      <div className='my-3.5 rounded-lg bg-[#0A0E1A] p-3.5 font-mono text-[11px] leading-relaxed sm:text-[12px]'>
        <div className='mb-2.5 flex items-center gap-1.5'>
          <span className='size-2.5 rounded-full bg-[#E5484D]' />
          <span className='size-2.5 rounded-full bg-[#F5B943]' />
          <span className='size-2.5 rounded-full bg-[#27C26B]' />
        </div>
        <div className='flex flex-col gap-0.5 overflow-hidden'>
          {previewLines.map((line) => (
            <code
              key={line}
              className='truncate text-[#B8BFCC]'
              title={line}
            >
              {line}
            </code>
          ))}
        </div>
      </div>

      <div className='grid gap-1.5'>
        {props.signals.map((signal) => {
          const Icon = signal.icon

          return (
            <div
              key={signal.label}
              className='flex items-center justify-between gap-3 rounded-md bg-[#F7F8FA] px-3 py-2'
            >
              <span className='flex min-w-0 items-center gap-2'>
                <IconBadge tone={signal.tone} size='xs'>
                  <Icon />
                </IconBadge>
                <span className='truncate text-[12px] font-medium text-[#0A0E1A]'>
                  {signal.label}
                </span>
              </span>
              <span className='text-[#5A6478] shrink-0 text-[12px] tabular-nums'>
                {signal.value}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function QuickActionItem(props: { action: QuickAction }) {
  const Icon = props.action.icon

  return (
    <Button
      variant='outline'
      className='h-auto justify-start gap-3 rounded-xl border-[#E5E8EE] bg-white/80 px-3.5 py-3 text-left hover:bg-white hover:border-[#D8DCE5] hover:shadow-[0_1px_2px_rgba(10,14,26,0.05)]'
      render={<Link to={props.action.to} />}
    >
      <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F8FA] text-[#5A6478]'>
        <Icon className='size-4' aria-hidden='true' />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-[13px] font-semibold tracking-[-0.01em] text-[#0A0E1A]'>
          {props.action.title}
        </span>
        <span className='text-[#8A93A4] line-clamp-1 text-[12px] leading-relaxed'>
          {props.action.description}
        </span>
      </span>
      <ArrowRight
        className='text-[#B8BFCC] group-hover/button:text-[#0A0E1A] size-4 shrink-0 transition-colors'
        aria-hidden='true'
      />
    </Button>
  )
}

function CompactQuickAction(props: { action: QuickAction }) {
  const Icon = props.action.icon

  return (
    <Button
      variant='outline'
      size='sm'
      className='h-8 min-w-24 gap-1.5 bg-white/80 px-2.5 text-[12px] border-[#E5E8EE]'
      render={<Link to={props.action.to} />}
    >
      <Icon data-icon='inline-start' className='size-3.5' />
      <span>{props.action.title}</span>
    </Button>
  )
}

export function OverviewDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { items: apiInfoItems } = useApiInfo()
  const {
    apiInfo: showApiInfoPanel,
    announcements: showAnnouncementsPanel,
    faq: showFAQPanel,
    uptimeKuma: showUptimePanel,
  } = useDashboardContentVisibility()
  const [manualSetupGuideExpanded, setManualSetupGuideExpanded] = useState<
    boolean | null
  >(() => getSavedSetupGuideExpanded())

  const requestCount = Number(user?.request_count ?? 0)
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)

  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = await getApiKeys({ p: 1, size: 10 })
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const modelsQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'user-models'],
    queryFn: async () => {
      const result = await getUserModels()
      return result.success ? (result.data ?? []) : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const preferredKey = useMemo(
    () => getPreferredKey(apiKeysQuery.data ?? []),
    [apiKeysQuery.data]
  )

  const startSteps = useMemo<StartStep[]>(
    () => [
      {
        title: t('Create API Key'),
        description: t('Create a key for your app or service'),
        to: '/keys',
        icon: KeyRound,
        completed: Boolean(preferredKey),
      },
      {
        title: t('Add credits'),
        description: t('Keep enough balance before production traffic'),
        to: '/wallet',
        icon: CreditCard,
        completed: remainQuota > 0 || usedQuota > 0,
      },
      {
        title: t('Send a request'),
        description: t('Verify routing with Playground or your client'),
        to: '/playground',
        icon: TerminalSquare,
        completed: requestCount > 0,
      },
    ],
    [preferredKey, remainQuota, requestCount, t, usedQuota]
  )

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        title: t('API Keys'),
        description: t('Create a key for your app or service'),
        to: '/keys',
        icon: KeyRound,
      },
      {
        title: t('Channels'),
        description: t('Configure upstream providers and routing.'),
        to: '/channels',
        icon: RadioTower,
        adminOnly: true,
      },
      {
        title: t('Usage Logs'),
        description: t('Inspect requests, errors, and billing details'),
        to: '/usage-logs',
        icon: FileText,
      },
      {
        title: t('Pricing'),
        description: t('Review model rates before scaling traffic'),
        to: '/pricing',
        icon: BookOpen,
      },
    ],
    [t]
  )

  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => !action.adminOnly || isAdmin),
    [isAdmin, quickActions]
  )

  const heroSignals = useMemo<HeroSignal[]>(
    () => [
      {
        label: t('Route active'),
        value: apiInfoItems.length > 0 ? t('Online') : t('Current domain'),
        icon: RadioTower,
        tone: 'info',
      },
      {
        label: t('Auth configured'),
        value: preferredKey ? t('Secured') : t('Needs API key'),
        icon: ShieldCheck,
        tone: 'success',
      },
      {
        label: t('Model selected'),
        value: modelsQuery.data?.[0] ?? t('Loading'),
        icon: Timer,
        tone: 'chart-4',
      },
    ],
    [apiInfoItems.length, modelsQuery.data, preferredKey, t]
  )

  const requestExample = useMemo<RequestExample>(() => {
    const endpoint = normalizeEndpoint(apiInfoItems[0]?.url)
    const model = modelsQuery.data?.[0] ?? 'gpt-4o-mini'
    const keyName = preferredKey?.name ?? t('No API key yet')
    const ready = Boolean(preferredKey?.id && model)

    return {
      endpoint,
      model,
      keyName,
      keyId: preferredKey?.id,
      displayKey: preferredKey
        ? formatDisplayKey(`sk-${preferredKey.key}`)
        : 'sk-...',
      ready,
    }
  }, [apiInfoItems, modelsQuery.data, preferredKey, t])

  const completedStepCount = startSteps.filter((step) => step.completed).length
  const setupComplete = completedStepCount === startSteps.length
  const setupStatusReady = apiKeysQuery.isFetched && Boolean(user)
  const setupGuideExpanded =
    manualSetupGuideExpanded ?? (setupStatusReady && !setupComplete)
  const showLeftContentPanels =
    isAdmin || showApiInfoPanel || showAnnouncementsPanel || showFAQPanel
  const showContentPanels = showLeftContentPanels || showUptimePanel

  const handleSetupGuideToggle = () => {
    const nextExpanded = !setupGuideExpanded
    setManualSetupGuideExpanded(nextExpanded)
    saveSetupGuideExpanded(nextExpanded)
  }

  return (
    <div className='flex flex-col gap-5'>
      {setupGuideExpanded ? (
        <CardStaggerContainer>
          <CardStaggerItem className='h-full overflow-hidden'>
            <div
              data-slot='card'
              className='group/card bg-card text-card-foreground border-border/70 shadow-card relative h-full overflow-hidden rounded-xl border p-5 sm:p-6'
            >
              <SetupGuideBackdrop />
              <div className='relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'>
                <div className='flex min-w-0 flex-col gap-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex max-w-2xl flex-col gap-1.5'>
                      <div className='text-[#8A93A4] flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em]'>
                        <ListChecks className='size-3.5' aria-hidden='true' />
                        {t('Get started')}
                      </div>
                      <h3 className='text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[26px] text-[#0A0E1A]'>
                        {t('Build on your API gateway in minutes')}
                      </h3>
                      <p className='text-[#5A6478] max-w-xl text-[13px] leading-relaxed'>
                        {t(
                          'A focused home for keys, balance, routing, and service health.'
                        )}
                      </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleSetupGuideToggle}
                        className='text-[#5A6478]'
                      >
                        <ChevronUp data-icon='inline-start' className='size-3.5' />
                        {t('Hide setup guide')}
                      </Button>
                      <Button size='sm' render={<Link to='/keys' />}>
                        <KeyRound data-icon='inline-start' className='size-3.5' />
                        {t('Create API Key')}
                      </Button>
                    </div>
                  </div>

                  <ol className='pt-1'>
                    {startSteps.map((step, index) => (
                      <StartStepItem
                        key={step.title}
                        step={step}
                        index={index}
                        isLast={index === startSteps.length - 1}
                      />
                    ))}
                  </ol>
                </div>

                <RequestPreview
                  example={requestExample}
                  signals={heroSignals}
                />
              </div>

              <div className='relative mt-5 flex flex-col gap-3 border-t border-[#E5E8EE] pt-5'>
                <div className='text-[#8A93A4] text-[11px] font-medium uppercase tracking-[0.08em]'>
                  {t('Recommended actions')}
                </div>
                <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
                  {visibleQuickActions.map((action) => (
                    <QuickActionItem key={action.title} action={action} />
                  ))}
                </div>
              </div>
            </div>
          </CardStaggerItem>
        </CardStaggerContainer>
      ) : (
        <CardStaggerContainer>
          <CardStaggerItem className='overflow-hidden'>
            <div
              data-slot='card'
              className='group/card bg-card text-card-foreground border-border/70 shadow-card relative overflow-hidden rounded-xl border p-4 sm:p-5'
            >
              <SetupGuideBackdrop compact />
              <div className='relative flex flex-wrap items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E5E8EE] bg-white shadow-[0_1px_2px_rgba(10,14,26,0.04)]'>
                    <Check className='text-success size-4' aria-hidden='true' />
                  </span>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='truncate text-[14px] font-semibold tracking-[-0.01em] text-[#0A0E1A]'>
                        {setupComplete
                          ? t('Setup guide complete')
                          : t('Setup guide')}
                      </h3>
                      <span className='text-[#5A6478] inline-flex items-center rounded-md border border-[#E5E8EE] bg-white px-2 py-0.5 text-[11px] font-medium tabular-nums'>
                        {t('Setup progress: {{completed}}/{{total}}', {
                          completed: completedStepCount,
                          total: startSteps.length,
                        })}
                      </span>
                    </div>
                    <p className='text-[#8A93A4] line-clamp-1 text-[12px] leading-relaxed'>
                      {setupComplete
                        ? t(
                            'Your setup guide is collapsed so usage stays in focus.'
                          )
                        : t('Setup guide is collapsed. Expand it anytime.')}
                    </p>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-1.5'>
                  {visibleQuickActions.map((action) => (
                    <CompactQuickAction key={action.title} action={action} />
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-8 min-w-28 border-[#E5E8EE] bg-white/80'
                    onClick={handleSetupGuideToggle}
                  >
                    <ChevronDown data-icon='inline-start' className='size-3.5' />
                    {t('Show setup guide')}
                  </Button>
                </div>
              </div>
            </div>
          </CardStaggerItem>
        </CardStaggerContainer>
      )}

      <SummaryCards />

      {showContentPanels && (
        <CardStaggerContainer
          className={cn(
            'grid grid-cols-1 gap-5',
            showLeftContentPanels &&
              showUptimePanel &&
              'xl:grid-cols-[minmax(0,1fr)_22rem]'
          )}
        >
          {showLeftContentPanels && (
            <div
              className={cn(
                'grid min-w-0 grid-cols-1 gap-5',
                (showApiInfoPanel || showAnnouncementsPanel || showFAQPanel) &&
                  'lg:grid-cols-2'
              )}
            >
              {isAdmin && (
                <CardStaggerItem className='lg:col-span-2'>
                  <PerformanceHealthPanel />
                </CardStaggerItem>
              )}
              {showApiInfoPanel && (
                <CardStaggerItem>
                  <ApiInfoPanel />
                </CardStaggerItem>
              )}
              {showAnnouncementsPanel && (
                <CardStaggerItem>
                  <AnnouncementsPanel />
                </CardStaggerItem>
              )}
              {showFAQPanel && (
                <CardStaggerItem>
                  <FAQPanel />
                </CardStaggerItem>
              )}
            </div>
          )}
          {showUptimePanel && (
            <CardStaggerItem>
              <UptimePanel />
            </CardStaggerItem>
          )}
        </CardStaggerContainer>
      )}
    </div>
  )
}
