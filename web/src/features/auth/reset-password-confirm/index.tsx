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
import { useNavigate } from '@tanstack/react-router'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCountdown } from '@/hooks/use-countdown'
import { api } from '@/lib/api'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { cn } from '@/lib/utils'

import { AuthLayout } from '../auth-layout'

export type ResetPasswordSearchParams = {
  email?: string
  token?: string
}

type ResetPasswordConfirmProps = ResetPasswordSearchParams

const inputCls =
  'h-11 rounded-xl border-[#E5E8EE] bg-white px-3.5 text-[14px] text-[#0A0E1A] shadow-sm placeholder:text-[#B8BFCC] focus-visible:border-[#0A0E1A] focus-visible:ring-[#0A0E1A]/15 disabled:cursor-not-allowed disabled:border-[#E5E8EE] disabled:bg-[#F7F8FA] disabled:text-[#8A93A4] disabled:opacity-100'
const labelCls = 'text-[13px] font-medium text-[#0A0E1A]'
const btnPrimary =
  'h-11 rounded-xl bg-[#0A0E1A] text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0A0E1A]/90 active:bg-[#0A0E1A]'

export function ResetPasswordConfirm({
  email,
  token,
}: ResetPasswordConfirmProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { secondsLeft, isActive, start: startCountdown } = useCountdown({
    initialSeconds: 30,
  })

  const isValidResetLink = Boolean(email && token)

  async function handleSubmit() {
    if (!isValidResetLink || !email || !token) {
      toast.error(t('Invalid reset link, please request a new password reset'))
      return
    }

    startCountdown()
    setLoading(true)
    try {
      const res = await api.post('/api/user/reset', { email, token }, {
        skipBusinessError: true,
      } as Record<string, unknown>)

      if (res?.data?.success) {
        const password = res.data.data
        setNewPassword(password)
        const copySuccess = await copyToClipboard(password)
        if (copySuccess) {
          toast.success(
            t('Password reset and copied to clipboard: {{password}}', {
              password,
            })
          )
        } else {
          toast.success(t('Password reset: {{password}}', { password }))
        }
      }
    } catch {
      // Errors handled by global interceptor
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!newPassword) return

    const copySuccess = await copyToClipboard(newPassword)
    if (copySuccess) {
      setCopied(true)
      toast.success(
        t('Password copied to clipboard: {{password}}', {
          password: newPassword,
        })
      )
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-2 text-center sm:text-left'>
          <h1 className='text-[26px] font-semibold leading-tight tracking-tight text-[#0A0E1A]'>
            {t('Reset password')}
          </h1>
          <p className='text-[14px] leading-relaxed text-[#5A6478]'>
            {newPassword
              ? t('auth.resetPasswordConfirm.success')
              : t('auth.resetPasswordConfirm.description')}
          </p>
        </div>

        <div className='rounded-2xl border border-[#E5E8EE] bg-white p-6 shadow-sm sm:p-8'>
          <div className='space-y-4'>
            {!isValidResetLink && (
              <Alert
                variant='destructive'
                className='border-rose-200 bg-rose-50/60 px-3 py-2.5 text-rose-700 *:data-[slot=alert-description]:text-rose-600'
              >
                <AlertDescription className='text-[13px] leading-relaxed'>
                  {t(
                    'Invalid reset link, please request a new password reset.'
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email' className={labelCls}>
                {t('Email')}
              </Label>
              <Input
                id='email'
                type='email'
                value={email || ''}
                disabled
                placeholder={t('Waiting for email...')}
                className={inputCls}
              />
            </div>

            {newPassword && (
              <div className='space-y-2'>
                <Label htmlFor='password' className={labelCls}>
                  {t('New password')}
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='password'
                    value={newPassword}
                    disabled
                    className={cn(inputCls, 'font-mono')}
                  />
                  <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    onClick={handleCopy}
                    className='h-11 w-11 shrink-0 rounded-xl border-[#E5E8EE] bg-white text-[#5A6478] shadow-sm transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
                  >
                    {copied ? (
                      <CheckIcon className='h-4 w-4' />
                    ) : (
                      <CopyIcon className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <p className='text-[12px] text-[#8A93A4]'>
                  {t('Password has been copied to clipboard')}
                </p>
              </div>
            )}

            <Button
              className={cn(btnPrimary, 'w-full')}
              onClick={
                newPassword
                  ? () => navigate({ to: '/sign-in', replace: true })
                  : handleSubmit
              }
              disabled={
                newPassword ? false : loading || isActive || !isValidResetLink
              }
            >
              {newPassword
                ? t('auth.resetPasswordConfirm.backToLogin')
                : isActive
                  ? t('auth.resetPasswordConfirm.retry', {
                      seconds: secondsLeft,
                    })
                  : t('auth.resetPasswordConfirm.confirm')}
            </Button>

            {!newPassword && (
              <div className='flex justify-center'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => navigate({ to: '/sign-in', replace: true })}
                  className='h-auto p-0 text-[13px] font-medium text-[#5A6478] no-underline transition-colors hover:bg-transparent hover:text-[#0A0E1A]'
                >
                  {t('Back to login')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
