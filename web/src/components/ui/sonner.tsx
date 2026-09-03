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
'use client'

import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Alert02Icon,
  MultiplicationSignCircleIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/context/theme-provider'

const Toaster = (props: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      className='toaster group'
      icons={{
        success: (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className='size-4 text-[#30A46C]'
          />
        ),
        info: (
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={2}
            className='size-4 text-[#0091FF]'
          />
        ),
        warning: (
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className='size-4 text-[#F5A524]'
          />
        ),
        error: (
          <HugeiconsIcon
            icon={MultiplicationSignCircleIcon}
            strokeWidth={2}
            className='size-4 text-[#E5484D]'
          />
        ),
        loading: (
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            className='size-4 animate-spin text-[#5A6478]'
          />
        ),
      }}
      style={
        {
          '--normal-bg': 'white',
          '--normal-text': '#0A0E1A',
          '--normal-border': '#E5E8EE',
          '--success-bg': 'white',
          '--success-border': '#E5E8EE',
          '--success-text': '#0A0E1A',
          '--info-bg': 'white',
          '--info-border': '#E5E8EE',
          '--info-text': '#0A0E1A',
          '--warning-bg': 'white',
          '--warning-border': '#E5E8EE',
          '--warning-text': '#0A0E1A',
          '--error-bg': 'white',
          '--error-border': '#E5E8EE',
          '--error-text': '#0A0E1A',
          '--border-radius': '0.75rem',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
