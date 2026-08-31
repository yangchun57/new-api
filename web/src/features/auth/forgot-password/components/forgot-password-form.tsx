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
import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { z } from 'zod'

import { Turnstile } from '@/components/turnstile'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { sendPasswordResetEmail } from '@/features/auth/api'
import {
  forgotPasswordFormSchema,
  PASSWORD_RESET_COUNTDOWN,
} from '@/features/auth/constants'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/utils'

const inputCls =
  'h-11 rounded-xl border-[#E5E8EE] bg-white px-3.5 text-[14px] text-[#0A0E1A] shadow-sm placeholder:text-[#B8BFCC] focus-visible:border-[#0A0E1A] focus-visible:ring-[#0A0E1A]/15 aria-invalid:border-rose-400 aria-invalid:ring-rose-400/20'
const labelCls = 'text-[13px] font-medium text-[#0A0E1A]'
const btnPrimary =
  'h-11 rounded-xl bg-[#0A0E1A] text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0A0E1A]/90 active:bg-[#0A0E1A]'

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()
  const { secondsLeft, isActive, start: startCountdown } = useCountdown({
    initialSeconds: PASSWORD_RESET_COUNTDOWN,
  })

  const form = useForm<z.infer<typeof forgotPasswordFormSchema>>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })
  const turnstileReady = !isTurnstileEnabled || Boolean(turnstileToken)

  async function onSubmit(data: z.infer<typeof forgotPasswordFormSchema>) {
    if (!validateTurnstile()) return

    setIsLoading(true)
    try {
      const res = await sendPasswordResetEmail(data.email, turnstileToken)
      if (res?.success) {
        form.reset()
        startCountdown()
        toast.success(t('Reset email sent, please check your inbox'))
      } else {
        toast.error(res?.message || t('Failed to send reset email'))
      }
    } catch (_error) {
      // Errors are handled by global interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>{t('Email')}</FormLabel>
              <FormControl>
                <Input
                  placeholder='name@example.com'
                  className={inputCls}
                  {...field}
                />
              </FormControl>
              <FormMessage className='text-[12px]' />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className={cn(btnPrimary, 'mt-2 gap-2')}
          disabled={isLoading || isActive || !turnstileReady}
        >
          {isActive
            ? t('Resend ({{seconds}}s)', { seconds: secondsLeft })
            : t('Send reset email')}
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <ArrowRight className='h-4 w-4' />
          )}
        </Button>

        {isTurnstileEnabled && (
          <div className='mt-2 flex justify-center'>
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
            />
          </div>
        )}
      </form>
    </Form>
  )
}
