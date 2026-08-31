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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useStatus } from '@/hooks/use-status'

import { AuthLayout } from '../auth-layout'
import { TermsFooter } from '../components/terms-footer'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  const { t } = useTranslation()
  const { status } = useStatus()

  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-2 text-center sm:text-left'>
          <h1 className='text-[26px] font-semibold leading-tight tracking-tight text-[#0A0E1A]'>
            {t('Create an account')}
          </h1>
          <p className='text-[14px] leading-relaxed text-[#5A6478]'>
            {t('Already have an account?')}{' '}
            <Link
              to='/sign-in'
              className='font-medium text-[#0A0E1A] underline decoration-[#D8DCE5] underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A]/50'
            >
              {t('Sign in')}
            </Link>
            .
          </p>
        </div>

        <div className='rounded-2xl border border-[#E5E8EE] bg-white p-6 shadow-sm sm:p-8'>
          <SignUpForm />
        </div>

        <TermsFooter
          variant='sign-up'
          status={status}
          className='text-center'
        />
      </div>
    </AuthLayout>
  )
}
