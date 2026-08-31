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
import { useNavigate, useRouter } from '@tanstack/react-router'
import { AlertOctagon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FEEDBACK_URL = 'https://github.com/QuantumNous/new-api/issues'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
  error?: unknown
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const response = (error as Record<string, unknown>).response
  if (typeof response !== 'object' || response === null) return undefined
  const status = (response as Record<string, unknown>).status
  return typeof status === 'number' ? status : undefined
}

export function GeneralError({
  className,
  minimal = false,
  error,
}: GeneralErrorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { history } = useRouter()
  const status = getHttpStatus(error)
  const isRateLimited = status === 429
  const title = isRateLimited
    ? t('Too many requests')
    : `${t('Oops! Something went wrong')} ${`:')`}`
  const description = isRateLimited
    ? t('Please wait a moment before trying again.')
    : t('Please try again later.')

  if (minimal) {
    return (
      <div className={cn('flex h-full w-full flex-col items-center justify-center gap-2 bg-white px-6', className)}>
        <AlertOctagon className='mb-2 h-6 w-6 text-[#8A93A4]' strokeWidth={1.75} />
        <span className='text-[15px] font-medium text-[#0A0E1A]'>{title}</span>
        <p className='max-w-[360px] text-center text-[13px] leading-relaxed text-[#5A6478]'>
          {t('We apologize for the inconvenience.')} {description}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('min-h-svh flex items-center justify-center bg-white px-6', className)}>
      <div className='w-full max-w-[420px] flex flex-col items-center text-center'>
        <div className='mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] text-[#0A0E1A] shadow-sm'>
          <AlertOctagon className='h-6 w-6' strokeWidth={1.75} />
        </div>
        <span className='mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8A93A4]'>
          Error {status ?? 500}
        </span>
        <h1 className='text-[28px] font-semibold leading-tight tracking-tight text-[#0A0E1A]'>
          {title}
        </h1>
        <p className='mt-3 text-[14px] leading-relaxed text-[#5A6478]'>
          {t('We apologize for the inconvenience.')} {description}
        </p>
        <p className='mt-2 text-[12px] leading-relaxed text-[#8A93A4]'>
          {t('If this keeps happening, please report it on GitHub Issues.')}
        </p>
        <div className='mt-8 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center'>
          <Button
            variant='outline'
            onClick={() => history.go(-1)}
            className='h-11 rounded-xl border-[#E5E8EE] bg-white px-5 text-[14px] font-medium text-[#0A0E1A] shadow-sm transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
          >
            {t('Go Back')}
          </Button>
          <Button
            variant='outline'
            render={
              <a
                href={FEEDBACK_URL}
                target='_blank'
                rel='noopener noreferrer'
              />
            }
            className='h-11 rounded-xl border-[#E5E8EE] bg-white px-5 text-[14px] font-medium text-[#0A0E1A] shadow-sm transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
          >
            {t('Report an issue')}
          </Button>
          <Button
            onClick={() => navigate({ to: '/' })}
            className='h-11 w-full rounded-xl bg-[#0A0E1A] px-5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0A0E1A]/90 sm:w-auto'
          >
            {t('Back to Home')}
          </Button>
        </div>
      </div>
    </div>
  )
}
