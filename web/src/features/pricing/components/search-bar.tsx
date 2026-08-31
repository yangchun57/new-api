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
import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  className?: string
}

export function SearchBar(props: SearchBarProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative', props.className)}>
      <Search className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#5A6478]' />
      <input
        ref={inputRef}
        type='text'
        placeholder={props.placeholder || t('Search models...')}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={cn(
          'pl-search-input h-12 w-full rounded-full border border-[#E5E8EE] bg-white pr-20 pl-11 pl-nav-shadow text-[14px] text-[#0A0E1A] outline-none transition-all duration-200 placeholder:text-[#8A93A4]',
          'hover:border-[#CBD3E0]',
          'focus:border-[#2E4BFF]/40 focus:ring-4 focus:ring-[#2E4BFF]/8'
        )}
        aria-label={t('Search models')}
      />
      <div className='absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1'>
        {props.value ? (
          <Button
            variant='ghost'
            size='icon'
            onClick={props.onClear}
            className='size-7 text-[#5A6478] hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
            aria-label={t('Clear search')}
          >
            <X className='size-4' />
          </Button>
        ) : (
          <kbd className='pointer-events-none hidden rounded-md border border-[#E5E8EE] bg-[#F7F8FA] px-1.5 py-0.5 pl-font-mono text-[10px] text-[#5A6478] sm:inline-block'>
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  )
}
