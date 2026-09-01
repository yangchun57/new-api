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
import { Download, RefreshCw, Activity, Coins, Database, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePicker } from '@/components/date-picker'
import { useThemeCustomization } from '@/context/theme-customization-provider'
import { useTheme } from '@/context/theme-provider'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { getUserQuotaDates, getUserTokens } from '@/features/users/api'
import type { User, UserTokenOption } from '@/features/users/types'
import dayjs from '@/lib/dayjs'
import { formatLogQuota, formatNumber } from '@/lib/format'
import {
  dateToUnixTimestamp,
  getEndOfDay,
  getNormalizedDateRange,
  getStartOfDay,
  type TimeGranularity,
} from '@/lib/time'
import { VCHART_OPTION } from '@/lib/vchart'

import { getTokenQuotaDates } from '../api'
import type { ApiKey } from '../types'

let vchartThemeManagerPromise: Promise<
  (typeof import('@visactor/vchart'))['ThemeManager']
> | null = null

interface TokenUsageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiKey?: ApiKey | null
  user?: User | null
}

type TableRow = {
  id: string
  date: string
  hour: string
  model: string
  tokens: number
  requests: number
  quota: number
}

function buildCsv(rows: TableRow[], t: (k: string) => string): string {
  const header = [
    t('Date'),
    t('Hour'),
    t('Model'),
    t('Tokens'),
    t('Requests'),
    t('Cost'),
  ]
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [r.date, r.hour, `"${r.model.replaceAll('"', '""')}"`, r.tokens, r.requests, formatLogQuota(r.quota)].join(',')
    )
  }
  return lines.join('\n')
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function TokenUsageDialog({
  open,
  onOpenChange,
  apiKey = null,
  user = null,
}: TokenUsageDialogProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { customization } = useThemeCustomization()

  const isUserMode = user != null && apiKey == null

  const defaultRange = useMemo(() => getNormalizedDateRange(7), [])
  const [startDate, setStartDate] = useState<Date>(defaultRange.start)
  const [endDate, setEndDate] = useState<Date>(defaultRange.end)
  const [granularity, setGranularity] = useState<TimeGranularity>('day')
  const [startHour, setStartHour] = useState<string>('0')
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [selectedTokenId, setSelectedTokenId] = useState<string>('all')
  const [tokenOptions, setTokenOptions] = useState<UserTokenOption[]>([])
  const [data, setData] = useState<QuotaDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [chartType, setChartType] = useState<'quota' | 'tokens' | 'count'>('quota')
  const fetchedRef = useRef<string>('')
  const requestSeqRef = useRef(0)

  useEffect(() => {
    if (open) {
      const r = getNormalizedDateRange(7)
      setStartDate(r.start)
      setEndDate(r.end)
      setGranularity('day')
      setStartHour('0')
      setSelectedModel('all')
      setSelectedTokenId('all')
      setTokenOptions([])
      setChartType('quota')
      setData([])
    }
  }, [open, apiKey?.id, user?.id])

  useEffect(() => {
    const updateTheme = async () => {
      setThemeReady(false)
      if (!vchartThemeManagerPromise) {
        vchartThemeManagerPromise = import('@visactor/vchart').then(
          (m) => m.ThemeManager
        )
      }
      const ThemeManager = await vchartThemeManagerPromise
      ThemeManager.setCurrentTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
      setThemeReady(true)
    }
    updateTheme()
  }, [resolvedTheme])

  useEffect(() => {
    if (!open || !user) return
    let cancelled = false
    getUserTokens(user.id)
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setTokenOptions(res.data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, user])

  const fetchData = async () => {
    if (!apiKey && !user) return
    const userId = user?.id ?? 0
    let startTs = dateToUnixTimestamp(getStartOfDay(startDate))
    let endTs = dateToUnixTimestamp(getEndOfDay(endDate))
    if (granularity === 'hour') {
      const h = Number(startHour) || 0
      startTs = dateToUnixTimestamp(getStartOfDay(startDate)) + h * 3600
      endTs = startTs + 86400
    }
    if (endTs - startTs > 2592000) {
      toast.error(t('Time range cannot exceed 30 days'))
      return
    }
    const key = apiKey
      ? `${apiKey.id}-${startTs}-${endTs}`
      : `${userId}-${selectedTokenId}-${startTs}-${endTs}`
    if (fetchedRef.current === key && data.length > 0) return
    const requestSeq = ++requestSeqRef.current
    setLoading(true)
    try {
      const res = apiKey
        ? await getTokenQuotaDates({
            token_id: apiKey.id,
            start_timestamp: startTs,
            end_timestamp: endTs,
          })
        : await getUserQuotaDates({
            user_id: userId,
            ...(selectedTokenId !== 'all'
              ? { token_id: Number(selectedTokenId) }
              : {}),
            start_timestamp: startTs,
            end_timestamp: endTs,
          })
      if (requestSeq !== requestSeqRef.current) return
      if (res.success && res.data) {
        setData(res.data)
        fetchedRef.current = key
      } else {
        toast.error(res.message || t('Failed to fetch data'))
      }
    } catch {
      if (requestSeq !== requestSeqRef.current) return
      toast.error(t('Failed to fetch data'))
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (open && (apiKey || user)) {
      fetchedRef.current = ''
      void fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apiKey?.id, user?.id, selectedTokenId])

  const availableModels = useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => {
      if (d.model_name) set.add(d.model_name)
    })
    return [...set].sort()
  }, [data])

  const filteredData = useMemo(() => {
    if (selectedModel === 'all') return data
    return data.filter((d) => d.model_name === selectedModel)
  }, [data, selectedModel])

  const totals = useMemo(() => {
    let tokens = 0
    let requests = 0
    let quota = 0
    for (const d of filteredData) {
      tokens += Number(d.token_used) || 0
      requests += Number(d.count) || 0
      quota += Number(d.quota) || 0
    }
    return { tokens, requests, quota }
  }, [filteredData])

  const tableRows: TableRow[] = useMemo(() => {
    const sorted = [...filteredData].sort(
      (a, b) => Number(a.created_at) - Number(b.created_at)
    )
    return sorted.map((d) => {
      const ts = Number(d.created_at) * 1000
      return {
        id: d.id != null ? String(d.id) : `${d.created_at}-${d.model_name ?? ''}`,
        date: dayjs(ts).format('YYYY-MM-DD'),
        hour: dayjs(ts).format('HH:00'),
        model: d.model_name || '-',
        tokens: Number(d.token_used) || 0,
        requests: Number(d.count) || 0,
        quota: Number(d.quota) || 0,
      }
    })
  }, [filteredData])

  const chartSpec = useMemo(() => {
    const colorPalette = [
      '#5B8FF9',
      '#5AD8A6',
      '#F6BD16',
      '#E8684A',
      '#6DC8EC',
      '#9270CA',
      '#FF9D4D',
      '#269A99',
    ]

    if (filteredData.length === 0) {
      return {
        type: 'bar',
        data: [{ id: 'empty', values: [] }],
        xField: 'Time',
        yField: 'Value',
        seriesField: 'Model',
        legends: { visible: false },
      }
    }

    const timeModelMap = new Map<
      string,
      Map<string, { tokens: number; count: number; quota: number }>
    >()
    const modelTotals = new Map<string, { tokens: number; count: number; quota: number }>()

    filteredData.forEach((item) => {
      const ts = Number(item.created_at)
      let timeKey: string
      if (granularity === 'hour') {
        timeKey = dayjs(ts * 1000).format('MM-DD HH:00')
      } else {
        timeKey = dayjs(ts * 1000).format('YYYY-MM-DD')
      }
      const model = item.model_name || 'Unknown'
      const tokens = Number(item.token_used) || 0
      const count = Number(item.count) || 0
      const quota = Number(item.quota) || 0

      let mm = timeModelMap.get(timeKey)
      if (!mm) {
        mm = new Map()
        timeModelMap.set(timeKey, mm)
      }
      const prev = mm.get(model) || { tokens: 0, count: 0, quota: 0 }
      mm.set(model, {
        tokens: prev.tokens + tokens,
        count: prev.count + count,
        quota: prev.quota + quota,
      })
      const mt = modelTotals.get(model) || { tokens: 0, count: 0, quota: 0 }
      modelTotals.set(model, {
        tokens: mt.tokens + tokens,
        count: mt.count + count,
        quota: mt.quota + quota,
      })
    })

    const times = [...timeModelMap.keys()].sort()
    const allModels = [...modelTotals.keys()]
    const rankedModels = allModels
      .map((m) => ({
        model: m,
        ...(modelTotals.get(m) ?? { tokens: 0, count: 0, quota: 0 }),
      }))
      .sort((a, b) => {
        if (chartType === 'tokens') return b.tokens - a.tokens
        if (chartType === 'count') return b.count - a.count
        return b.quota - a.quota
      })
    const topModels = new Set(rankedModels.slice(0, 10).map((r) => r.model))

    let yField: string
    if (chartType === 'quota') {
      yField = 'Amount'
    } else if (chartType === 'tokens') {
      yField = 'Tokens'
    } else {
      yField = 'Count'
    }
    const values: Array<Record<string, string | number>> = []

    times.forEach((time) => {
      const mm = timeModelMap.get(time) ?? new Map()
      const buckets = new Map<string, { tokens: number; count: number; quota: number; amount: number }>()
      allModels.forEach((m) => {
        const s = mm.get(m) || { tokens: 0, count: 0, quota: 0 }
        const key = topModels.has(m) ? m : t('Other')
        const prev = buckets.get(key) || { tokens: 0, count: 0, quota: 0, amount: 0 }
        const amount = s.quota > 0 ? Number((s.quota / 500000).toFixed(6)) : 0
        buckets.set(key, {
          tokens: prev.tokens + s.tokens,
          count: prev.count + s.count,
          quota: prev.quota + s.quota,
          amount: Number((prev.amount + amount).toFixed(6)),
        })
      })
      for (const [model, v] of buckets) {
        values.push({
          Time: time,
          Model: model,
          Tokens: v.tokens,
          Count: v.count,
          Amount: v.amount,
          rawQuota: v.quota,
        })
      }
    })
    values.sort((a, b) => String(a.Time).localeCompare(String(b.Time)))

    const modelDomain = [...new Set([...topModels, t('Other')])]
    const color = {
      type: 'ordinal',
      domain: modelDomain,
      range: colorPalette,
    }

    const tooltipValueFormatter = (datum: Record<string, unknown>) => {
      if (chartType === 'quota') return formatLogQuota(Number(datum.rawQuota) || 0)
      if (chartType === 'tokens') return formatNumber(Number(datum.Tokens) || 0)
      return formatNumber(Number(datum.Count) || 0)
    }

    return {
      type: 'bar',
      data: [{ id: 'chartData', values }],
      xField: 'Time',
      yField,
      seriesField: 'Model',
      stack: true,
      color,
      legends: { visible: true, selectMode: 'single', position: 'bottom' },
      bar: {
        state: { hover: { stroke: '#000', lineWidth: 1 } },
        style: { cornerRadius: customization.radius === 'none' ? 0 : 2 },
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum.Model,
              value: tooltipValueFormatter,
            },
          ],
        },
        dimension: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum.Model,
              value: tooltipValueFormatter,
            },
          ],
          updateContent: (array: Array<{ key: string; value: string | number; datum?: Record<string, unknown> }>) => {
            array.sort((a, b) => {
              const av = Number(a.datum?.[yField]) || 0
              const bv = Number(b.datum?.[yField]) || 0
              return bv - av
            })
            let sum = 0
            for (const item of array) {
              const v = Number(item.datum?.[yField]) || 0
              sum += chartType === 'quota' ? Number(item.datum?.rawQuota) || 0 : v
              if (chartType === 'quota') {
                item.value = formatLogQuota(Number(item.datum?.rawQuota) || 0)
              } else {
                item.value = formatNumber(v)
              }
            }
            array.unshift({
              key: t('Total:'),
              value: chartType === 'quota' ? formatLogQuota(sum) : formatNumber(sum),
            })
            return array
          },
        },
      },
      axes: [
        { orient: 'bottom', type: 'band' },
        {
          orient: 'left',
          type: 'linear',
          label: {
            formatMethod: (value: number) => {
              if (chartType === 'quota') return `$${Number(value).toFixed(4)}`
              if (chartType === 'tokens') {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                return String(value)
              }
              return formatNumber(value)
            },
          },
        },
      ],
      background: 'transparent',
      animation: true,
    }
  }, [filteredData, granularity, chartType, t, customization.radius])

  const handleExport = () => {
    if (tableRows.length === 0) {
      toast.info(t('No data available'))
      return
    }
    const csv = buildCsv(tableRows, t)
    const name =
      apiKey?.name || user?.display_name || user?.username || 'token'
    downloadCsv(
      `token-usage-${name}-${dayjs(startDate).format('YYYYMMDD')}-${dayjs(endDate).format('YYYYMMDD')}.csv`,
      csv
    )
    toast.success(t('Export successful'))
  }

  const chartKey = [
    chartType,
    granularity,
    filteredData.length,
    selectedModel,
    resolvedTheme,
  ].join('-')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className='max-h-[92vh] w-[calc(100%-1.5rem)] max-w-6xl gap-0 overflow-hidden p-0 sm:max-w-6xl sm:p-0'
      >
        <div className='max-h-[92vh] overflow-y-auto'>
          <DialogHeader className='flex flex-row items-start justify-between gap-4 border-b border-[#E5E8EE] px-6 py-5'>
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center gap-2'>
                <DialogTitle className='text-[18px]'>{t('Token Usage')}</DialogTitle>
                {(apiKey || user) && (
                  <Badge
                    variant='outline'
                    className='rounded-md border-[#E5E8EE] bg-[#F7F8FA] px-2 py-0.5 text-[12px] font-medium text-[#5A6478]'
                  >
                    {apiKey
                      ? apiKey.name
                      : user?.display_name || user?.username}
                  </Badge>
                )}
              </div>
              <p className='text-[13px] leading-relaxed text-[#8A93A4]'>
                {t('View token usage data within the selected time range (max 30 days)')}
              </p>
            </div>
          </DialogHeader>

          <div className='flex flex-col gap-4 p-5 sm:p-6'>
            {/* Filter Bar */}
            <div className='flex flex-wrap items-end gap-3 rounded-xl border border-[#E5E8EE] bg-white p-2.5 sm:p-3'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[12px] font-medium text-[#5A6478]'>
                  {t('Start Date')}
                </label>
                <DatePicker
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[12px] font-medium text-[#5A6478]'>
                  {t('End Date')}
                </label>
                <DatePicker selected={endDate} onSelect={(d) => d && setEndDate(d)} />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[12px] font-medium text-[#5A6478]'>
                  {t('Granularity')}
                </label>
                <Tabs
                  value={granularity}
                  onValueChange={(v) => setGranularity(v as TimeGranularity)}
                >
                  <TabsList>
                    <TabsTrigger value='day'>{t('Day')}</TabsTrigger>
                    <TabsTrigger value='hour'>{t('Hour')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {granularity === 'hour' && (
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[12px] font-medium text-[#5A6478]'>
                    {t('Start Hour')}
                  </label>
                  <Select value={startHour} onValueChange={(v) => v && setStartHour(v)}>
                    <SelectTrigger className='w-[100px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className='flex flex-col gap-1.5'>
                <label className='text-[12px] font-medium text-[#5A6478]'>
                  {t('Model')}
                </label>
                <Select value={selectedModel} onValueChange={(v) => v && setSelectedModel(v)}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder={t('All Models')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('All Models')}</SelectItem>
                    {availableModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isUserMode && (
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[12px] font-medium text-[#5A6478]'>
                    {t('API Key')}
                  </label>
                  <Select
                    value={selectedTokenId}
                    onValueChange={(v) => v && setSelectedTokenId(v)}
                  >
                    <SelectTrigger className='w-[200px]'>
                      <SelectValue placeholder={t('All API Keys')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{t('All API Keys')}</SelectItem>
                      {tokenOptions.map((token) => (
                        <SelectItem key={token.id} value={String(token.id)}>
                          {token.name || token.key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className='ms-auto flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExport}
                  className='gap-1.5'
                >
                  <Download className='size-3.5' />
                  {t('Export CSV')}
                </Button>
                <Button
                  size='sm'
                  onClick={fetchData}
                  disabled={loading}
                  className='gap-1.5'
                >
                  <RefreshCw
                    className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  {t('Query')}
                </Button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              <StatCard
                icon={Coins}
                title={t('Total Cost')}
                value={formatLogQuota(totals.quota)}
                tone='chart-1'
              />
              <StatCard
                icon={Zap}
                title={t('Total Tokens')}
                value={formatNumber(totals.tokens)}
                tone='chart-2'
              />
              <StatCard
                icon={Activity}
                title={t('Total Requests')}
                value={formatNumber(totals.requests)}
                tone='chart-3'
              />
            </div>

            {/* Chart */}
            <div className='rounded-xl border border-[#E5E8EE] bg-white p-4 sm:p-5'>
              <div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <h3 className='text-[14px] font-semibold text-[#0A0E1A]'>
                  {t('Usage Trend')}
                </h3>
                <Tabs value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
                  <TabsList>
                    <TabsTrigger value='quota'>{t('Cost')}</TabsTrigger>
                    <TabsTrigger value='tokens'>{t('Tokens')}</TabsTrigger>
                    <TabsTrigger value='count'>{t('Requests')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className='h-[320px]'>
                {themeReady && !loading && (
                  <VChart
                    key={chartKey}
                    spec={{
                      ...chartSpec,
                      theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                      background: 'transparent',
                    }}
                    option={VCHART_OPTION}
                  />
                )}
                {loading && (
                  <div className='flex h-full items-center justify-center text-[13px] text-[#8A93A4]'>
                    <RefreshCw className='mr-2 size-4 animate-spin' />
                    {t('Loading')}...
                  </div>
                )}
                {!loading && filteredData.length === 0 && (
                  <div className='flex h-full items-center justify-center text-[13px] text-[#8A93A4]'>
                    <Database className='mr-2 size-4' />
                    {t('No data available')}
                  </div>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className='rounded-xl border border-[#E5E8EE] bg-white'>
              <div className='flex items-center justify-between border-b border-[#E5E8EE] px-5 py-3.5'>
                <h3 className='text-[14px] font-semibold text-[#0A0E1A]'>
                  {t('Detailed Records')}
                </h3>
                <span className='text-[12px] text-[#8A93A4]'>
                  {t('Total {{count}} records', { count: tableRows.length })}
                </span>
              </div>
              {tableRows.length === 0 ? (
                <div className='flex h-40 items-center justify-center text-[13px] text-[#8A93A4]'>
                  {t('No data available')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead>{t('Hour')}</TableHead>
                      <TableHead>{t('Model')}</TableHead>
                      <TableHead className='text-right'>{t('Tokens')}</TableHead>
                      <TableHead className='text-right'>{t('Requests')}</TableHead>
                      <TableHead className='text-right'>{t('Cost')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className='font-mono text-[12.5px] text-[#5A6478]'>
                          {row.date}
                        </TableCell>
                        <TableCell className='font-mono text-[12.5px] text-[#5A6478]'>
                          {row.hour}
                        </TableCell>
                        <TableCell>
                          <span className='inline-block max-w-[200px] truncate rounded-md bg-[#F7F8FA] px-2 py-0.5 font-mono text-[12px] text-[#0A0E1A]'>
                            {row.model}
                          </span>
                        </TableCell>
                        <TableCell className='text-right font-mono'>
                          {formatNumber(row.tokens)}
                        </TableCell>
                        <TableCell className='text-right font-mono'>
                          {formatNumber(row.requests)}
                        </TableCell>
                        <TableCell className='text-right font-mono text-[#0A0E1A]'>
                          {formatLogQuota(row.quota)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <p className='text-center text-[11.5px] text-[#8A93A4]'>
              {t('Data is updated hourly; quota is calculated from recorded usage and may have minor delays')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: typeof Coins
  title: string
  value: string
  tone: 'chart-1' | 'chart-2' | 'chart-3'
}) {
  const toneColors: Record<string, { bg: string; text: string }> = {
    'chart-1': { bg: 'bg-[#5B8FF9]/10', text: 'text-[#5B8FF9]' },
    'chart-2': { bg: 'bg-[#5AD8A6]/10', text: 'text-[#16A34A]' },
    'chart-3': { bg: 'bg-[#F6BD16]/10', text: 'text-[#D97706]' },
  }
  const c = toneColors[tone]
  return (
    <div className='rounded-xl border border-[#E5E8EE] bg-white p-4'>
      <div className='mb-3 flex items-center gap-2'>
        <div className={`flex size-7 items-center justify-center rounded-md ${c.bg}`}>
          <Icon className={`size-3.5 ${c.text}`} />
        </div>
        <span className='text-[12px] font-medium text-[#5A6478]'>{title}</span>
      </div>
      <div className='font-mono text-[22px] font-semibold tracking-tight text-[#0A0E1A]'>
        {value}
      </div>
    </div>
  )
}
