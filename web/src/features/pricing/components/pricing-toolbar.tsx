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
import { ArrowUpDown, Check, Filter, Grid2X2, Table2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  sideDrawerContentClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  VIEW_MODES,
  getSortLabels,
  type SortOption,
  type ViewMode,
} from '../constants'
import type { PricingModel, PricingVendor, TokenUnit } from '../types'
import { PricingSidebar } from './pricing-sidebar'

type SegmentOption = {
  value: string
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  tooltip?: string
}

export interface PricingToolbarProps {
  filteredCount: number
  totalCount?: number
  sortBy: string
  onSortChange: (value: string) => void
  tokenUnit: TokenUnit
  onTokenUnitChange: (value: TokenUnit) => void
  showRechargePrice: boolean
  onRechargePriceChange: (value: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  quotaTypeFilter: string
  endpointTypeFilter: string
  vendorFilter: string
  groupFilter: string
  tagFilter: string
  onQuotaTypeChange: (value: string) => void
  onEndpointTypeChange: (value: string) => void
  onVendorChange: (value: string) => void
  onGroupChange: (value: string) => void
  onTagChange: (value: string) => void
  vendors: PricingVendor[]
  groups: string[]
  groupRatios?: Record<string, number>
  tags: string[]
  models: PricingModel[]
  hasActiveFilters: boolean
  activeFilterCount: number
  onClearFilters: () => void
}

function SegmentedControl(props: {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
}) {
  return (
    <div
      role='group'
      aria-label={props.ariaLabel}
      className='inline-flex h-8 items-center gap-0.5 rounded-full border border-[#E5E8EE] bg-white p-0.5 pl-nav-shadow'
    >
      {props.options.map((option) => {
        const Icon = option.icon
        const isActive = option.value === props.value
        const button = (
          <button
            key={option.value}
            type='button'
            onClick={() => props.onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex h-full items-center justify-center rounded-full pl-font-display text-[12px] font-semibold transition-all duration-200',
              Icon && !option.label ? 'w-7' : 'gap-1 px-3',
              isActive
                ? 'bg-[#0A0E1A] text-white shadow-[0_2px_6px_rgba(10,14,26,0.15)]'
                : 'text-[#5A6478] hover:text-[#0A0E1A]'
            )}
          >
            {Icon && <Icon className='size-3.5' />}
            {option.label}
          </button>
        )

        if (!option.tooltip) {
          return button
        }

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger render={button}></TooltipTrigger>
            <TooltipContent side='bottom' className='text-xs'>
              {option.tooltip}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function PricingToolbar(props: PricingToolbarProps) {
  const { t } = useTranslation()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const sortLabels = getSortLabels(t)

  const handleTokenUnitChange = useCallback(
    (value: string) => props.onTokenUnitChange(value as TokenUnit),
    [props]
  )

  const handleViewModeChange = useCallback(
    (value: string) => props.onViewModeChange(value as ViewMode),
    [props]
  )

  const handleRechargePriceChange = useCallback(
    (value: string) => props.onRechargePriceChange(value === 'recharge'),
    [props]
  )

  return (
    <div className='pl-card p-3 sm:p-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setMobileFiltersOpen(true)}
            className='h-8 gap-1.5 rounded-full border-[#E5E8EE] bg-white pl-nav-shadow text-[12px] pl-cta-secondary xl:hidden'
          >
            <Filter className='size-3.5' />
            {t('Filter')}
            {props.activeFilterCount > 0 && (
              <Badge className='ml-0.5 size-5 justify-center rounded-full bg-[#0A0E1A] p-0 pl-font-mono text-[10px] text-white hover:bg-[#0A0E1A]'>
                {props.activeFilterCount}
              </Badge>
            )}
          </Button>

          <div className='flex items-baseline gap-1.5 pl-font-display text-[13px] text-[#5A6478]'>
            <span className='text-[#0A0E1A] font-bold tabular-nums'>
              {props.filteredCount.toLocaleString()}
            </span>
            <span>
              {props.filteredCount === 1 ? t('model') : t('models')}
            </span>
            {props.hasActiveFilters && props.totalCount && (
              <span className='text-[#8A93A4] text-[12px]'>
                / {props.totalCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='hidden items-center gap-2 sm:flex'>
            <SegmentedControl
              options={[
                { value: 'standard', label: t('Standard') },
                { value: 'recharge', label: t('Recharge') },
              ]}
              value={props.showRechargePrice ? 'recharge' : 'standard'}
              onChange={handleRechargePriceChange}
              ariaLabel={t('Price display mode')}
            />
            <SegmentedControl
              options={[
                { value: 'M', label: '/1M' },
                { value: 'K', label: '/1K' },
              ]}
              value={props.tokenUnit}
              onChange={handleTokenUnitChange}
              ariaLabel={t('Token unit')}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-8 gap-1.5 rounded-full border-[#E5E8EE] bg-white px-3 pl-nav-shadow pl-cta-secondary pl-font-display text-[12px] font-semibold text-[#0A0E1A]'
                />
              }
            >
              <ArrowUpDown className='size-3.5' />
              <span>
                {sortLabels[props.sortBy as SortOption] || t('Sort')}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-44 rounded-xl border-[#E5E8EE] p-1.5 pl-nav-shadow'
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => props.onSortChange(value)}
                  className='gap-2 rounded-lg text-[13px]'
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      props.sortBy === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <SegmentedControl
            options={[
              {
                value: VIEW_MODES.CARD,
                icon: Grid2X2,
                tooltip: t('Card view'),
              },
              {
                value: VIEW_MODES.TABLE,
                icon: Table2,
                tooltip: t('Table view'),
              },
            ]}
            value={props.viewMode}
            onChange={handleViewModeChange}
            ariaLabel={t('View mode')}
          />
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side='right'
          className={sideDrawerContentClassName('sm:max-w-md')}
        >
          <SheetHeader className={sideDrawerHeaderClassName()}>
            <SheetTitle>{t('Filter')}</SheetTitle>
            <SheetDescription>
              {t('Filter models by provider, group, type, endpoint, and tags.')}
            </SheetDescription>
          </SheetHeader>
          <div className={sideDrawerFormClassName('gap-0')}>
            <PricingSidebar
              quotaTypeFilter={props.quotaTypeFilter}
              endpointTypeFilter={props.endpointTypeFilter}
              vendorFilter={props.vendorFilter}
              groupFilter={props.groupFilter}
              tagFilter={props.tagFilter}
              onQuotaTypeChange={props.onQuotaTypeChange}
              onEndpointTypeChange={props.onEndpointTypeChange}
              onVendorChange={props.onVendorChange}
              onGroupChange={props.onGroupChange}
              onTagChange={props.onTagChange}
              vendors={props.vendors}
              groups={props.groups}
              groupRatios={props.groupRatios}
              tags={props.tags}
              models={props.models}
              hasActiveFilters={props.hasActiveFilters}
              onClearFilters={props.onClearFilters}
              className='border-0 bg-transparent p-0 shadow-none'
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
