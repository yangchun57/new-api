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
import { Skeleton } from '@/components/ui/skeleton'

import { VIEW_MODES, type ViewMode } from '../constants'

export interface LoadingSkeletonProps {
  viewMode?: ViewMode
}

export function LoadingSkeleton(props: LoadingSkeletonProps) {
  const viewMode = props.viewMode ?? VIEW_MODES.CARD

  return (
    <div className='space-y-6'>
      <div className='mx-auto max-w-3xl space-y-4 pt-4 text-center'>
        <Skeleton className='mx-auto h-10 w-64' />
        <Skeleton className='mx-auto h-4 w-80' />
        <Skeleton className='mx-auto h-4 w-56' />
        <Skeleton className='mx-auto mt-2 h-12 w-full max-w-2xl rounded-full' />
      </div>
      <div className='mt-6 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
        <div className='pl-card hidden h-[520px] p-4 xl:block'>
          <div className='mb-4 flex items-center justify-between'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-6 w-14' />
          </div>
          <div className='space-y-5'>
            {[80, 110, 70, 90, 60].map((h, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-3.5 w-20' />
                <div className='flex flex-wrap gap-1.5'>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className='h-6 w-16 rounded-md' />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-14 w-full rounded-2xl' />
          {viewMode === VIEW_MODES.TABLE ? (
            <TableContentSkeleton />
          ) : (
            <CardContentSkeleton />
          )}
        </div>
      </div>
    </div>
  )
}

function CardContentSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className='pl-card p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-3'>
              <Skeleton className='size-10 shrink-0 rounded-xl' />
              <div className='min-w-0 flex-1 space-y-2'>
                <Skeleton className='h-5 w-36' />
                <Skeleton className='h-3.5 w-48' />
              </div>
            </div>
            <Skeleton className='h-8 w-16 rounded-full' />
          </div>
          <div className='mt-4 space-y-2'>
            <Skeleton className='h-3.5 w-full' />
            <Skeleton className='h-3.5 w-4/5' />
          </div>
          <div className='mt-4 flex items-center gap-2'>
            <Skeleton className='h-5 w-20 rounded-full' />
            <Skeleton className='h-5 w-24 rounded-full' />
          </div>
          <div className='mt-3 flex items-center gap-3'>
            <Skeleton className='h-3.5 w-14' />
            <Skeleton className='h-3.5 w-14' />
            <Skeleton className='h-3.5 w-8' />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableContentSkeleton() {
  const columns = [
    { width: 200 },
    { width: 100 },
    { width: 120 },
    { width: 100 },
    { width: 100 },
    { width: 130 },
    { width: 130 },
  ]

  return (
    <div className='pl-card space-y-0'>
      <div className='border-b border-[#E5E8EE] bg-[#FAFBFC] px-5 py-3'>
        <div className='flex items-center gap-4'>
          {columns.map((col, i) => (
            <Skeleton
              key={i}
              className='h-4'
              style={{ width: `${col.width}px` }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className='flex items-center gap-4 border-b border-[#F0F2F6] px-5 py-3.5 last:border-b-0'
        >
          {columns.map((col, j) => (
            <Skeleton
              key={j}
              className='h-5'
              style={{ width: `${col.width}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
