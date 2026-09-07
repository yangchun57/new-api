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
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { useSuppressSettingsSectionHeader } from './settings-page-context'

type SettingsSectionProps = {
  title: string
  titleProps?: React.HTMLAttributes<HTMLHeadingElement>
  children: React.ReactNode
  className?: string
}

export function SettingsSection({
  title,
  titleProps,
  children,
  className,
}: SettingsSectionProps) {
  const suppressHeader = useSuppressSettingsSectionHeader()

  return (
    <Card className={cn('flex min-h-0 flex-1 flex-col gap-0 p-5', className)}>
      {!suppressHeader && (
        <CardHeader className='p-0 pb-4'>
          <h3
            {...titleProps}
            className={cn(
              'text-[14px] font-semibold leading-snug tracking-[-0.01em] text-[#0A0E1A]',
              titleProps?.className
            )}
          >
            {title}
          </h3>
        </CardHeader>
      )}
      <CardContent className='min-h-0 flex-1 overflow-y-auto p-0'>
        {children}
      </CardContent>
    </Card>
  )
}
