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
import { ShieldCheck } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { PasswordInput } from '@/components/password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import type { SetupFormValues } from '../types'

const inputCls =
  'h-11 rounded-xl border-[#E5E8EE] bg-white px-3.5 text-[14px] text-[#0A0E1A] shadow-sm placeholder:text-[#B8BFCC] focus-visible:border-[#0A0E1A] focus-visible:ring-[#0A0E1A]/15 aria-invalid:border-rose-400 aria-invalid:ring-rose-400/20'
const labelCls = 'text-[13px] font-medium text-[#0A0E1A]'
const formMsgCls = 'text-[12px] text-rose-600'

interface AdminStepProps {
  form: UseFormReturn<SetupFormValues>
  rootInitialized?: boolean
}

export function AdminStep({ form, rootInitialized }: AdminStepProps) {
  const { t } = useTranslation()
  if (rootInitialized) {
    return (
      <Alert className='rounded-xl border-sky-200/80 bg-sky-50/60 px-4 py-3 text-sky-700'>
        <AlertDescription className='flex items-start gap-2 text-[13px] leading-relaxed text-sky-700'>
          <ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-sky-500' />
          {t(
            'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.'
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='grid gap-5 sm:grid-cols-2'>
      <FormField
        control={form.control}
        name='username'
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>{t('Administrator username')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t('Choose a username')}
                autoComplete='username'
                className={inputCls}
                onChange={(event) => {
                  form.clearErrors('username')
                  field.onChange(event)
                }}
              />
            </FormControl>
            <FormMessage className={formMsgCls} />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='password'
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>{t('Password')}</FormLabel>
            <FormControl>
              <PasswordInput
                {...field}
                placeholder={t('Set a secure password (min. 8 characters)')}
                autoComplete='new-password'
                className={inputCls}
                onChange={(event) => {
                  form.clearErrors('password')
                  field.onChange(event)
                }}
              />
            </FormControl>
            <FormMessage className={formMsgCls} />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='confirmPassword'
        render={({ field }) => (
          <FormItem className='sm:col-span-2'>
            <FormLabel className={labelCls}>{t('Confirm password')}</FormLabel>
            <FormControl>
              <PasswordInput
                {...field}
                placeholder={t('Repeat the administrator password')}
                autoComplete='new-password'
                className={inputCls}
                onChange={(event) => {
                  form.clearErrors('confirmPassword')
                  field.onChange(event)
                }}
              />
            </FormControl>
            <FormMessage className={formMsgCls} />
          </FormItem>
        )}
      />
    </div>
  )
}
