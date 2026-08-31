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
import { Building2, Home, Presentation } from 'lucide-react'
import type { ComponentType } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import type { SetupFormValues, SetupUsageMode } from '../types'

interface UsageModeStepProps {
  form: UseFormReturn<SetupFormValues>
}

const USAGE_MODE_OPTIONS: Array<{
  value: SetupUsageMode
  titleKey: string
  descriptionKey: string
  icon: ComponentType<{ className?: string }>
}> = [
  {
    value: 'external',
    titleKey: 'External operations',
    descriptionKey:
      'Serve multiple users or teams with billing and quota control.',
    icon: Building2,
  },
  {
    value: 'self',
    titleKey: 'Personal use',
    descriptionKey:
      'Best for single-tenant deployments. Pricing and billing options stay hidden.',
    icon: Home,
  },
  {
    value: 'demo',
    titleKey: 'Demo site',
    descriptionKey:
      'Showcase core capabilities with demo credentials and limited access.',
    icon: Presentation,
  },
]

const cardCls =
  'group flex cursor-pointer flex-col gap-3 rounded-xl border border-[#E5E8EE] bg-white p-4 font-normal transition-all hover:border-[#0A0E1A]/30 has-data-[checked]:border-[#0A0E1A] has-data-[checked]:bg-[#0A0E1A]/[0.03] has-data-[checked]:ring-2 has-data-[checked]:ring-[#0A0E1A]/10'
const radioCls =
  'mt-1 border-[#B8BFCC] text-white data-checked:border-[#0A0E1A] data-checked:bg-[#0A0E1A] data-checked:text-white focus-visible:border-[#0A0E1A] focus-visible:ring-[#0A0E1A]/15'
const iconCls =
  'ml-auto h-5 w-5 shrink-0 text-[#B8BFCC] transition-colors group-hover:text-[#5A6478] group-has-data-[checked]:text-[#0A0E1A]'

export function UsageModeStep({ form }: UsageModeStepProps) {
  const { t } = useTranslation()

  return (
    <FormField
      control={form.control}
      name='usageMode'
      render={({ field }) => (
        <FormItem>
          <FormLabel className='text-[13px] font-medium text-[#0A0E1A]'>
            {t('How will you use the platform?')}
          </FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(value) => {
                form.clearErrors('usageMode')
                field.onChange(value as SetupUsageMode)
              }}
              className='grid gap-3 sm:grid-cols-3'
            >
              {USAGE_MODE_OPTIONS.map(
                ({ value, titleKey, descriptionKey, icon: Icon }) => {
                  return (
                    <Label
                      key={value}
                      htmlFor={`usage-mode-${value}`}
                      className={cardCls}
                    >
                      <div className='flex items-start gap-3'>
                        <RadioGroupItem
                          id={`usage-mode-${value}`}
                          value={value}
                          className={radioCls}
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='text-[14px] font-semibold leading-none text-[#0A0E1A]'>
                            {t(titleKey)}
                          </p>
                          <p className='mt-2 text-[13px] leading-relaxed text-[#5A6478]'>
                            {t(descriptionKey)}
                          </p>
                        </div>
                        <Icon className={iconCls} />
                      </div>
                    </Label>
                  )
                }
              )}
            </RadioGroup>
          </FormControl>
          <FormMessage className='text-[12px] text-rose-600' />
        </FormItem>
      )}
    />
  )
}
