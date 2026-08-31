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

import { isDynamicPricingModel } from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import type { PricingModel } from '../types'

interface ModelBillingModeBadgeProps {
  model: PricingModel
  className?: string
}

export function ModelBillingModeBadge(props: ModelBillingModeBadgeProps) {
  const { t } = useTranslation()
  let label = t('Per Request')
  let textColor = 'text-[#7c3aed]'
  let bgColor = 'bg-[#F5F3FF]'

  if (isDynamicPricingModel(props.model)) {
    label = t('Dynamic Pricing')
    textColor = 'text-[#B45309]'
    bgColor = 'bg-[#FEF3C7]/70'
  } else if (isTokenBasedModel(props.model)) {
    label = t('Token-based')
    textColor = 'text-[#0369A1]'
    bgColor = 'bg-[#E0F2FE]'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-transparent px-2 py-0.5 pl-font-display text-[10px] font-semibold tracking-wide',
        bgColor,
        textColor,
        props.className
      )}
    >
      {label}
    </span>
  )
}
