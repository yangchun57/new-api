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

import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  const { t } = useTranslation()
  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-2 text-center sm:text-left'>
          <h1 className='text-[26px] font-semibold leading-tight tracking-tight text-[#0A0E1A]'>
            {t('Forgot password')}
          </h1>
          <p className='text-[14px] leading-relaxed text-[#5A6478]'>
            {t(
              'Enter your registered email and we will send you a link to reset your password.'
            )}
          </p>
          <p className='text-[14px] leading-relaxed text-[#5A6478]'>
            {t("Don't have an account?")}{' '}
            <Link
              to='/sign-up'
              className='font-medium text-[#0A0E1A] underline decoration-[#D8DCE5] underline-offset-[3px] transition-colors hover:decoration-[#0A0E1A]/50'
            >
              {t('Sign up')}
            </Link>
            .
          </p>
        </div>

        <div className='rounded-2xl border border-[#E5E8EE] bg-white p-6 shadow-sm sm:p-8'>
          <ForgotPasswordForm className='space-y-0' />
        </div>
      </div>
    </AuthLayout>
  )
}
