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

import { Skeleton } from '@/components/ui/skeleton'

export function ChannelEditorLoadingState() {
  const { t } = useTranslation()

  return (
    <div
      className='border-[#E5E8EE] flex flex-col gap-4 rounded-xl border p-4'
      aria-live='polite'
    >
      <div>
        <p className='text-[#0A0E1A] text-[14px] font-medium'>{t('Loading channel details')}</p>
        <p className='text-[#8A93A4] mt-1 text-[12px]'>
          {t('Please wait before editing to avoid overwriting saved values.')}
        </p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Skeleton className='h-10 w-full rounded-md' />
        <Skeleton className='h-10 w-full rounded-md' />
      </div>
      <Skeleton className='h-24 w-full rounded-md' />
      <Skeleton className='h-32 w-full rounded-md' />
    </div>
  )
}
