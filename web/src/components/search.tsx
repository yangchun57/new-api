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
import { SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useSearch } from '@/context/search-provider'
import { cn } from '@/lib/utils'

import { Button } from './ui/button'

type SearchProps = {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder }: SearchProps) {
  const { t } = useTranslation()
  const { setOpen } = useSearch()
  const resolvedPlaceholder = placeholder ?? t('Search')
  return (
    <Button
      variant='outline'
      className={cn(
        'group relative h-9 w-full flex-1 justify-start rounded-lg border-[#E5E8EE] bg-white px-3 text-[13px] font-normal text-[#8A93A4] shadow-none transition-colors hover:border-[#D8DCE5] hover:bg-white hover:text-[#5A6478] sm:w-44 sm:pe-12 md:flex-none lg:w-56 xl:w-64',
        className
      )}
      onClick={() => setOpen(true)}
      aria-label={resolvedPlaceholder}
    >
      <SearchIcon
        aria-hidden='true'
        className='me-2 size-4 shrink-0 text-[#B8BFCC]'
      />
      <span className='truncate'>{resolvedPlaceholder}</span>
      <kbd className='pointer-events-none absolute end-2 top-1/2 hidden h-5 -translate-y-1/2 items-center gap-0.5 rounded border border-[#E5E8EE] bg-[#FAFBFC] px-1.5 font-mono text-[10px] font-medium text-[#8A93A4] select-none sm:flex'>
        <span className='text-[11px]'>⌘</span>
        {t('K')}
      </kbd>
    </Button>
  )
}
