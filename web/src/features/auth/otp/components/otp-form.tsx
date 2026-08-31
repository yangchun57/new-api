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
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { login2fa } from '@/features/auth/api'
import {
  BACKUP_CODE_LENGTH,
  OTP_LENGTH,
  otpFormSchema,
} from '@/features/auth/constants'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import {
  cleanBackupCode,
  formatBackupCode,
  isValidBackupCode,
  isValidOTP,
} from '@/features/auth/lib/validation'
import { getServerErrorMessageKey } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>

const inputCls =
  'h-11 rounded-xl border-[#E5E8EE] bg-white px-3.5 text-[14px] text-[#0A0E1A] shadow-sm placeholder:text-[#B8BFCC] focus-visible:border-[#0A0E1A] focus-visible:ring-[#0A0E1A]/15 aria-invalid:border-rose-400 aria-invalid:ring-rose-400/20'
const labelCls = 'text-[13px] font-medium text-[#0A0E1A]'
const btnPrimary =
  'h-11 rounded-xl bg-[#0A0E1A] text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0A0E1A]/90 active:bg-[#0A0E1A]'

const otpSlotCls =
  'relative flex h-12 w-12 items-center justify-center rounded-xl border border-[#E5E8EE] bg-white text-[20px] font-mono text-[#0A0E1A] shadow-sm transition-all outline-none first:rounded-xl last:rounded-xl data-[active=true]:z-10 data-[active=true]:border-[#0A0E1A] data-[active=true]:ring-2 data-[active=true]:ring-[#0A0E1A]/15 aria-invalid:border-rose-400 data-[active=true]:aria-invalid:border-rose-400 data-[active=true]:aria-invalid:ring-rose-400/20'
const otpGroupCls = 'flex items-center gap-2'
const otpSeparatorCls = 'px-1 text-[#B8BFCC] [&_svg]:size-3.5'

export function OtpForm({ className, ...props }: OtpFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)

  const pending2FAFlowToken = useAuthStore(
    (state) => state.auth.pending2FAFlowToken
  )
  const { handleLoginSuccess, redirectToLogin } = useAuthRedirect()

  const form = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: '' },
  })

  const otp = form.watch('otp')

  async function onSubmit(data: z.infer<typeof otpFormSchema>) {
    if (useBackupCode) {
      if (!isValidBackupCode(data.otp)) {
        toast.error(t('Backup code must be in format XXXX-XXXX'))
        return
      }
    } else {
      if (!isValidOTP(data.otp)) {
        toast.error(t('Verification code must be 6 digits'))
        return
      }
    }

    setIsLoading(true)
    try {
      const code = useBackupCode ? cleanBackupCode(data.otp) : data.otp
      if (!pending2FAFlowToken) {
        toast.error(t('Login flow expired. Please sign in again.'))
        redirectToLogin()
        return
      }
      const res = await login2fa({
        code,
        flow_token: pending2FAFlowToken,
      })

      if (!res.success) {
        if (getServerErrorMessageKey(res)) return
        toast.error(res.message || t('Invalid code'))
        return
      }

      if (!res.data) {
        throw new Error(t('Login failed'))
      }

      await handleLoginSuccess(res.data)
      toast.success(t('Signed in'))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('2FA verification error:', error)
      if (getServerErrorMessageKey(error)) return
      const errorMessage =
        error instanceof Error ? error.message : t('Verification failed')
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  function handleToggleMode() {
    setUseBackupCode(!useBackupCode)
    form.setValue('otp', '')
  }

  function handleBackToLogin() {
    redirectToLogin()
  }

  const isFormValid = useBackupCode
    ? otp.length >= BACKUP_CODE_LENGTH
    : otp.length >= OTP_LENGTH

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='otp'
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>
                {useBackupCode ? t('Backup Code') : t('Verification Code')}
              </FormLabel>
              <FormControl>
                {useBackupCode ? (
                  <Input
                    placeholder={t('Enter backup code (e.g., CAWD-OQDV)')}
                    {...field}
                    maxLength={BACKUP_CODE_LENGTH}
                    autoComplete='off'
                    className={cn(inputCls, 'font-mono uppercase tracking-[0.2em]')}
                    onChange={(e) => {
                      const formatted = formatBackupCode(e.target.value)
                      field.onChange(formatted)
                    }}
                  />
                ) : (
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    {...field}
                    containerClassName='w-full items-center justify-between gap-0'
                  >
                    <InputOTPGroup className={otpGroupCls}>
                      <InputOTPSlot index={0} className={otpSlotCls} />
                      <InputOTPSlot index={1} className={otpSlotCls} />
                    </InputOTPGroup>
                    <InputOTPSeparator className={otpSeparatorCls} />
                    <InputOTPGroup className={otpGroupCls}>
                      <InputOTPSlot index={2} className={otpSlotCls} />
                      <InputOTPSlot index={3} className={otpSlotCls} />
                    </InputOTPGroup>
                    <InputOTPSeparator className={otpSeparatorCls} />
                    <InputOTPGroup className={otpGroupCls}>
                      <InputOTPSlot index={4} className={otpSlotCls} />
                      <InputOTPSlot index={5} className={otpSlotCls} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              </FormControl>
              <FormDescription className='text-[12px] leading-relaxed text-[#8A93A4]'>
                {useBackupCode
                  ? t('Each backup code can only be used once.')
                  : t('Verification code updates every 30 seconds.')}
              </FormDescription>
              <FormMessage className='text-[12px]' />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className={cn(btnPrimary, 'mt-2 w-full gap-2')}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
          {t('Verify and Sign In')}
        </Button>

        <div className='flex items-center justify-center gap-2 text-[13px]'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleToggleMode}
            className='h-auto p-0 font-medium text-[#5A6478] no-underline transition-colors hover:bg-transparent hover:text-[#0A0E1A]'
          >
            {useBackupCode ? t('Use authenticator code') : t('Use backup code')}
          </Button>
          <span className='text-[#D8DCE5]'>·</span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleBackToLogin}
            className='h-auto p-0 font-medium text-[#5A6478] no-underline transition-colors hover:bg-transparent hover:text-[#0A0E1A]'
          >
            {t('Back to login')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
