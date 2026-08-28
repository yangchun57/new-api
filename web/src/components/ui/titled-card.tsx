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

import { cn } from '@/lib/utils'

import { IconBadge, type IconBadgeTone } from './icon-badge'

type TitledCardProps = {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children?: ReactNode
  disableHoverEffect?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  iconClassName?: string
  iconTone?: IconBadgeTone
  titleClassName?: string
  descriptionClassName?: string
}

export function TitledCard({
  title,
  description,
  icon,
  action,
  children,
  disableHoverEffect,
  className,
  headerClassName,
  contentClassName,
  iconClassName,
  iconTone,
  titleClassName,
  descriptionClassName,
}: TitledCardProps) {
  return (
    <section
      data-slot='card'
      data-card-hover={disableHoverEffect ? 'false' : undefined}
      className={cn(
        'group/card bg-card text-card-foreground border-border/70 shadow-card flex flex-col gap-4 rounded-lg border p-4 sm:p-5',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
          headerClassName
        )}
      >
        <div className='flex min-w-0 items-center gap-3'>
          {icon != null && (
            <IconBadge size='title' tone={iconTone} className={iconClassName}>
              {icon}
            </IconBadge>
          )}
          <div className='min-w-0'>
            <div
              className={cn(
                'leading-snug font-medium tracking-tight text-lg sm:text-xl',
                titleClassName
              )}
            >
              {title}
            </div>
            {description != null && (
              <div
                className={cn(
                  'text-muted-foreground text-xs sm:text-sm',
                  descriptionClassName
                )}
              >
                {description}
              </div>
            )}
          </div>
        </div>
        {action != null && (
          <div className='w-full shrink-0 sm:w-auto'>{action}</div>
        )}
      </div>
      <div className={cn('min-w-0', contentClassName)}>{children}</div>
    </section>
  )
}
