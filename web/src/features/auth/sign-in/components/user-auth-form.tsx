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
import { Link } from '@tanstack/react-router'
import axios from 'axios'
import { Loader2, LogIn, KeyRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { z } from 'zod'

import { Dialog } from '@/components/dialog'
import { PasswordInput } from '@/components/password-input'
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
import { Label } from '@/components/ui/label'
import { login, wechatLoginByCode } from '@/features/auth/api'
import { LegalConsent } from '@/features/auth/components/legal-consent'
import { OAuthProviders } from '@/features/auth/components/oauth-providers'
import { loginFormSchema } from '@/features/auth/constants'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { beginPasskeyLogin, finishPasskeyLogin } from '@/features/auth/passkey'
import type { AuthFormProps } from '@/features/auth/types'
import { useStatus } from '@/hooks/use-status'
import { isAuthBundle } from '@/lib/api'
import {
  buildAssertionResult,
  prepareCredentialRequestOptions,
  isPasskeySupported as detectPasskeySupport,
} from '@/lib/passkey'
import { getServerErrorMessageKey } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const inputCls =
  'h-11 rounded-xl border-[#E5E8EE] bg-white px-3.5 text-[14px] text-[#0A0E1A] shadow-sm placeholder:text-[#B8BFCC] focus-visible:border-[#0A0E1A] focus-visible:ring-[#0A0E1A]/15 aria-invalid:border-rose-400 aria-invalid:ring-rose-400/20'
const labelCls = 'text-[13px] font-medium text-[#0A0E1A]'
const btnPrimary =
  'h-11 rounded-xl bg-[#0A0E1A] text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#0A0E1A]/90 active:bg-[#0A0E1A]'
const btnOutline =
  'h-11 rounded-xl border-[#E5E8EE] bg-white text-[14px] font-medium text-[#0A0E1A] shadow-sm transition-colors hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: AuthFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [wechatCode, setWeChatCode] = useState('')
  const [agreedToLegal, setAgreedToLegal] = useState(false)
  const [passkeySupported, setPasskeySupported] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [isWeChatDialogOpen, setIsWeChatDialogOpen] = useState(false)
  const [isWeChatSubmitting, setIsWeChatSubmitting] = useState(false)
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0)
  const legalConsentErrorMessage = t('Please agree to the legal terms first')
  const loginFailedMessage = t('Login failed')

  const { status } = useStatus()
  const passkeyLoginEnabled = Boolean(
    status?.passkey_login ?? status?.data?.passkey_login
  )
  const passwordLoginEnabled =
    (status?.password_login_enabled ??
      status?.data?.password_login_enabled ??
      true) !== false
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()
  const { handleLoginSuccess, redirectTo2FA } = useAuthRedirect()
  const setPending2FAFlowToken = useAuthStore(
    (state) => state.auth.setPending2FAFlowToken
  )

  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)
  const requiresLegalConsent = hasUserAgreement || hasPrivacyPolicy
  const passkeyButtonDisabled =
    isPasskeyLoading ||
    !passkeySupported ||
    (requiresLegalConsent && !agreedToLegal)
  const hasWeChatLogin = Boolean(status?.wechat_login)
  const hasOAuthLogin = Boolean(
    status?.github_oauth ||
      status?.discord_oauth ||
      status?.oidc_enabled ||
      status?.linuxdo_oauth ||
      status?.telegram_oauth ||
      (status?.custom_oauth_providers?.length ?? 0) > 0
  )
  const hasAlternativeLogin =
    passkeyLoginEnabled || hasWeChatLogin || hasOAuthLogin

  useEffect(() => {
    if (requiresLegalConsent) {
      setAgreedToLegal(false)
    } else {
      setAgreedToLegal(true)
    }
  }, [requiresLegalConsent])

  useEffect(() => {
    detectPasskeySupport()
      .then(setPasskeySupported)
      .catch(() => setPasskeySupported(false))
  }, [])

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const wechatQrCodeUrl = useMemo(() => {
    return (
      status?.wechat_qrcode ||
      status?.wechat_qr_code ||
      status?.wechat_qrcode_image_url ||
      status?.wechat_qr_code_image_url ||
      status?.wechat_account_qrcode_image_url ||
      status?.WeChatAccountQRCodeImageURL ||
      status?.data?.wechat_qrcode ||
      status?.data?.WeChatAccountQRCodeImageURL ||
      ''
    )
  }, [status])

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    if (requiresLegalConsent && !agreedToLegal) {
      toast.error(legalConsentErrorMessage)
      return
    }

    if (!validateTurnstile()) return

    const submittedTurnstileToken = turnstileToken
    if (isTurnstileEnabled) {
      setTurnstileToken('')
      setTurnstileWidgetKey((current) => current + 1)
    }

    setIsLoading(true)
    try {
      const res = await login({
        username: data.username,
        password: data.password,
        turnstile: submittedTurnstileToken,
      })

      if (res.success) {
        if (res.data && 'require_2fa' in res.data && res.data.require_2fa) {
          if (!res.data.flow_token) {
            throw new Error(t('Login flow expired. Please sign in again.'))
          }
          setPending2FAFlowToken(res.data.flow_token)
          redirectTo2FA()
          return
        }

        if (!isAuthBundle(res.data)) {
          throw new Error(t('Login failed'))
        }
        await handleLoginSuccess(res.data, redirectTo)
        toast.success(t('Welcome back!'))
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) return
      toast.error(error instanceof Error ? error.message : loginFailedMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenWeChatDialog = () => {
    if (requiresLegalConsent && !agreedToLegal) {
      toast.error(legalConsentErrorMessage)
      return
    }

    setIsWeChatDialogOpen(true)
  }

  const handleWeChatDialogChange = (open: boolean) => {
    setIsWeChatDialogOpen(open)
    if (!open) {
      setWeChatCode('')
      setIsWeChatSubmitting(false)
    }
  }

  async function handleWeChatLogin() {
    if (!wechatCode.trim()) {
      toast.error(t('Please enter the verification code'))
      return
    }

    setIsWeChatSubmitting(true)
    try {
      const res = await wechatLoginByCode(wechatCode)
      if (res?.success && isAuthBundle(res.data)) {
        await handleLoginSuccess(res.data, redirectTo)
        toast.success(t('Signed in via WeChat'))
        handleWeChatDialogChange(false)
      } else {
        if (getServerErrorMessageKey(res)) return
        toast.error(res?.message || loginFailedMessage)
      }
    } catch (error: unknown) {
      if (getServerErrorMessageKey(error)) return
      toast.error(loginFailedMessage)
    } finally {
      setIsWeChatSubmitting(false)
    }
  }

  async function handlePasskeyLogin() {
    if (requiresLegalConsent && !agreedToLegal) {
      toast.error(legalConsentErrorMessage)
      return
    }

    if (!passkeySupported) {
      toast.error(t('Passkey is not supported on this device'))
      return
    }

    if (!navigator?.credentials) {
      toast.error(t('Passkey is not available in this browser'))
      return
    }

    setIsPasskeyLoading(true)
    try {
      const begin = await beginPasskeyLogin()
      if (!begin.success) {
        if (getServerErrorMessageKey(begin)) return
        throw new Error(begin.message || t('Failed to start Passkey login'))
      }

      const publicKey = prepareCredentialRequestOptions(
        begin.data?.options ?? begin.data
      )
      const flowToken = begin.data?.flow_token
      if (!flowToken) {
        throw new Error(t('Login flow expired. Please sign in again.'))
      }

      const credential = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential | null

      if (!credential) {
        toast.info(t('Passkey login was cancelled'))
        return
      }

      const assertion = buildAssertionResult(credential)
      if (!assertion) {
        throw new Error(t('Invalid Passkey response'))
      }

      const finish = await finishPasskeyLogin(flowToken, assertion)
      if (!finish.success) {
        if (getServerErrorMessageKey(finish)) return
        throw new Error(finish.message || t('Failed to complete Passkey login'))
      }

      if (!isAuthBundle(finish.data)) {
        throw new Error(t('Missing user data from Passkey login response'))
      }

      await handleLoginSuccess(finish.data, redirectTo)
      toast.success(t('Signed in with Passkey'))
    } catch (error: unknown) {
      if (getServerErrorMessageKey(error)) return
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.info(t('Passkey login was cancelled or timed out'))
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error(t('Passkey login failed'))
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  const alternativeLoginMethods = (
    <>
      {passkeyLoginEnabled && (
        <div className='space-y-1.5'>
          <Button
            type='button'
            variant='outline'
            disabled={passkeyButtonDisabled}
            onClick={handlePasskeyLogin}
            className={btnOutline}
          >
            {isPasskeyLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <KeyRound className='h-4 w-4' />
            )}
            {t('Sign in with Passkey')}
          </Button>
          {!passkeySupported && (
            <p className='px-1 text-[12px] leading-relaxed text-[#8A93A4]'>
              {t('Passkey is not supported on this device.')}
            </p>
          )}
        </div>
      )}

      <OAuthProviders
        status={status}
        redirectTo={redirectTo}
        disabled={isLoading || (requiresLegalConsent && !agreedToLegal)}
        onWeChatLogin={hasWeChatLogin ? handleOpenWeChatDialog : undefined}
        isWeChatLoading={isWeChatSubmitting}
      />
    </>
  )

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        {hasAlternativeLogin && alternativeLoginMethods}

        {passwordLoginEnabled && (
          <>
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>
                    {t('Username or Email')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Enter your username or email')}
                      className={inputCls}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-[12px]' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='relative pt-1'>
                  <FormLabel className={labelCls}>{t('Password')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={t('Enter password')}
                      className={inputCls}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-[12px]' />
                  <Link
                    to='/forgot-password'
                    className='absolute end-0 top-0 z-10 text-[12px] font-medium text-[#8A93A4] transition-colors hover:text-[#0A0E1A]'
                  >
                    {t('Forgot password?')}
                  </Link>
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className={cn(btnPrimary, 'mt-1 gap-2')}
              disabled={isLoading || (requiresLegalConsent && !agreedToLegal)}
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <LogIn className='h-4 w-4' />
              )}
              {t('Sign in')}
            </Button>

            {isTurnstileEnabled && (
              <div className='flex justify-center'>
                <Turnstile
                  key={turnstileWidgetKey}
                  siteKey={turnstileSiteKey}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>
            )}
          </>
        )}

        <LegalConsent
          status={status}
          checked={agreedToLegal}
          onCheckedChange={setAgreedToLegal}
        />

        {!hasAlternativeLogin && alternativeLoginMethods}
      </form>

      {hasWeChatLogin && (
        <Dialog
          open={isWeChatDialogOpen}
          onOpenChange={handleWeChatDialogChange}
          title={t('WeChat sign in')}
          description={t(
            'Scan the QR code to follow the official account and reply with “验证码” to receive your verification code.'
          )}
          contentClassName='max-w-sm gap-0 overflow-hidden rounded-2xl border-[#E5E8EE] bg-white p-0 shadow-xl ring-0 sm:p-0'
          headerClassName='px-6 pt-6 pb-0'
          titleClassName='text-[15px] font-semibold text-[#0A0E1A]'
          descriptionClassName='text-[13px] leading-relaxed text-[#5A6478]'
          bodyClassName='space-y-4 px-6 py-5'
          footerClassName='border-t border-[#E5E8EE] bg-[#FAFBFC] px-6 py-4 sm:justify-end'
          footer={
            <>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleWeChatDialogChange(false)}
                disabled={isWeChatSubmitting}
                className='h-10 rounded-lg border-[#E5E8EE] bg-white text-[13px] text-[#5A6478] hover:bg-[#F7F8FA] hover:text-[#0A0E1A]'
              >
                {t('Cancel')}
              </Button>
              <Button
                type='button'
                onClick={handleWeChatLogin}
                disabled={
                  isWeChatSubmitting ||
                  !wechatCode.trim() ||
                  (requiresLegalConsent && !agreedToLegal)
                }
                className='h-10 gap-2 rounded-lg bg-[#0A0E1A] text-[13px] text-white hover:bg-[#0A0E1A]/90'
              >
                {isWeChatSubmitting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : null}
                {t('Confirm')}
              </Button>
            </>
          }
        >
          {wechatQrCodeUrl ? (
            <div className='flex justify-center'>
              <img
                src={wechatQrCodeUrl}
                alt={t('WeChat login QR code')}
                className='h-44 w-44 rounded-xl border border-[#E5E8EE] object-contain p-2'
              />
            </div>
          ) : (
            <p className='rounded-xl bg-[#FAFBFC] px-4 py-3 text-[13px] text-[#8A93A4]'>
              {t('QR code is not configured. Please contact support.')}
            </p>
          )}
          <div className='grid gap-2'>
            <Label
              htmlFor='wechat-code'
              className='text-[13px] font-medium text-[#0A0E1A]'
            >
              {t('Verification code')}
            </Label>
            <Input
              id='wechat-code'
              placeholder={t('Enter the verification code')}
              value={wechatCode}
              onChange={(event) => setWeChatCode(event.target.value)}
              autoComplete='one-time-code'
              className={inputCls}
            />
          </div>
        </Dialog>
      )}
    </Form>
  )
}
