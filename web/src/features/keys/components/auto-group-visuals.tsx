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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { GroupBadge } from '@/components/group-badge'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type GroupRatio = number | string | null | undefined

export const AUTO_GROUP_FRAME_CLASS_NAME =
  'border-[#2E4BFF]/40 relative overflow-visible border shadow-[0_1px_2px_rgba(10,14,26,0.04)]'

type AutoGroupFlowBorderProps = {
  shouldReduceMotion: boolean
}

export function AutoGroupFlowBorder(props: AutoGroupFlowBorderProps) {
  if (props.shouldReduceMotion) return null

  return (
    <span
      aria-hidden='true'
      data-auto-group-flow-border='true'
      className='auto-group-flow-border pointer-events-none absolute -inset-px'
    />
  )
}

type AutoGroupFrameProps = {
  children: ReactNode
  className?: string
  effect: 'badge' | 'ratio'
  shouldReduceMotion: boolean
}

export function AutoGroupFrame(props: AutoGroupFrameProps) {
  return (
    <span
      data-auto-group-frame='true'
      data-auto-group-effect={props.effect}
      className={cn(
        AUTO_GROUP_FRAME_CLASS_NAME,
        'inline-flex max-w-full shrink-0 rounded-4xl p-px',
        props.className
      )}
    >
      <AutoGroupFlowBorder shouldReduceMotion={props.shouldReduceMotion} />
      {props.children}
    </span>
  )
}

function getRatioBadgeClassName(ratio: GroupRatio, isAuto: boolean): string {
  if (isAuto || typeof ratio !== 'number') {
    return 'border-[#2E4BFF]/30 bg-[#2E4BFF]/[0.08] text-[#2E4BFF]'
  }
  if (ratio > 5) {
    return 'border-[#E5484D]/30 bg-[#E5484D]/[0.08] text-[#E5484D]'
  }
  if (ratio > 3) {
    return 'border-[#D97706]/30 bg-[#D97706]/[0.08] text-[#D97706]'
  }
  if (ratio > 1) {
    return 'border-[#2E4BFF]/30 bg-[#2E4BFF]/[0.08] text-[#2E4BFF]'
  }
  return 'border-[#16A34A]/30 bg-[#16A34A]/[0.08] text-[#16A34A]'
}

type GroupRatioBadgeProps = {
  isAuto?: boolean
  ratio: GroupRatio
  shouldReduceMotion?: boolean
}

export function GroupRatioBadge(props: GroupRatioBadgeProps) {
  const { t } = useTranslation()

  if (props.ratio === undefined || props.ratio === null || props.ratio === '') {
    return null
  }

  const label =
    typeof props.ratio === 'number'
      ? `${props.ratio}x ${t('Ratio')}`
      : `${t('Auto')} ${t('Ratio')}`
  const badge = (
    <Badge
      variant='outline'
      className={cn(
        'max-w-full truncate text-[10px] sm:text-[12px]',
        getRatioBadgeClassName(props.ratio, props.isAuto === true)
      )}
    >
      {label}
    </Badge>
  )

  if (!props.isAuto) {
    return <span className='max-w-24 shrink-0 sm:max-w-none'>{badge}</span>
  }

  return (
    <AutoGroupFrame
      effect='ratio'
      shouldReduceMotion={props.shouldReduceMotion ?? false}
      className='max-w-24 sm:max-w-none'
    >
      {badge}
    </AutoGroupFrame>
  )
}

export function AutoGroupBadge(props: AutoGroupFlowBorderProps) {
  return (
    <AutoGroupFrame
      effect='badge'
      shouldReduceMotion={props.shouldReduceMotion}
    >
      <GroupBadge group='auto' />
    </AutoGroupFrame>
  )
}
