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
import { LockKeyhole } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function UnauthorisedError() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='min-h-svh flex items-center justify-center bg-white px-6'>
      <div className='w-full max-w-[420px] flex flex-col items-center text-center'>
        <div className='mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5E8EE] bg-[#FAFBFC] text-[#0A0E1A] shadow-sm'>
          <LockKeyhole className='h-6 w-6' strokeWidth={1.75} />
        </div>
        <span className='mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8A93A4]'>
          Error 401
        </span>
        <h1 className='text-[28px] font-semibold leading-tight tracking-tight text-[#0A0E1A]'>
          {t('Unauthorized Access')}
        </h1>
        <p className='mt-3 text-[14px] leading-relaxed text-[#5A6478]'>
          {t('Please log in with the appropriate credentials')}{' '}
          {t('to access this resource.')}
        </p>
        <div className='mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center'>
          <Button
            variant='outline'
            onClick={() => history.go(-1)}
            className='h-11 rounded-xl border-[#E5E8EE] bg-white px-5 text-[14px] font-medium text-[#0A0E1A] shadow-sm transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
          >
            {t('Go Back')}
          </Button>
          <Button
            onClick={() => navigate({ to: '/sign-in' })}
            className='h-11 w-full rounded-xl bg-[#0A0E1A] px-5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0A0E1A]/90 sm:w-auto'
          >
            {t('Sign in')}
          </Button>
        </div>
        <p className='mt-6 text-[12px] text-[#8A93A4]'>
          <button
            type='button'
            onClick={() => navigate({ to: '/' })}
            className='font-medium text-[#5A6478] underline decoration-[#D8DCE5] underline-offset-[3px] transition-colors hover:text-[#0A0E1A] hover:decoration-[#0A0E1A]/50'
          >
            {t('Back to Home')}
          </button>
        </p>
      </div>
    </div>
  )
}
