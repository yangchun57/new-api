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
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Spinner } from '@/components/ui/spinner'

type TelegramLoginDialogProps = {
  open: boolean
  botName: string
  pending: boolean
  onOpenChange: (open: boolean) => void
  onAuthorization: (authorization: unknown) => void
}

let telegramCallbackSequence = 0

export function TelegramLoginDialog(props: TelegramLoginDialogProps) {
  const { t } = useTranslation()
  const widgetContainer = useRef<HTMLDivElement | null>(null)
  const authorizationHandler = useRef(props.onAuthorization)
  const [callbackName] = useState(
    () => `newApiTelegramLogin${++telegramCallbackSequence}`
  )
  const [widgetState, setWidgetState] = useState<
    'idle' | 'loading' | 'ready' | 'failed'
  >('idle')

  useEffect(() => {
    authorizationHandler.current = props.onAuthorization
  }, [props.onAuthorization])

  useEffect(() => {
    const container = widgetContainer.current
    const botName = props.botName.trim()
    if (!props.open || !container || !botName) return

    setWidgetState('loading')
    const callback = (authorization: unknown) => {
      authorizationHandler.current(authorization)
    }
    const browserWindow = window as unknown as Record<string, unknown>
    browserWindow[callbackName] = callback

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.dataset.telegramLogin = botName
    script.dataset.size = 'large'
    script.dataset.radius = '12'
    script.dataset.onauth = `${callbackName}(user)`
    const handleLoad = () => setWidgetState('ready')
    const handleError = () => setWidgetState('failed')
    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)
    container.replaceChildren(script)

    return () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      container.replaceChildren()
      delete browserWindow[callbackName]
    }
  }, [callbackName, props.botName, props.open])

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Telegram Login Widget')}
      description={t('Continue with Telegram')}
      contentClassName='max-w-sm gap-0 overflow-hidden rounded-2xl border-[#E5E8EE] bg-white p-0 shadow-xl ring-0 sm:p-0'
      contentHeight='auto'
      headerClassName='px-6 pt-6 pb-0'
      titleClassName='text-[15px] font-semibold text-[#0A0E1A]'
      descriptionClassName='text-[13px] leading-relaxed text-[#5A6478]'
      bodyClassName='space-y-4 px-6 py-5'
      footerClassName='border-t border-[#E5E8EE] bg-[#FAFBFC] px-6 py-4 sm:justify-end'
    >
      <div
        className='flex min-h-12 items-center justify-center'
        aria-busy={widgetState === 'loading' || props.pending}
      >
        {(widgetState === 'loading' || props.pending) && <Spinner />}
        {widgetState === 'failed' && (
          <p className='text-[13px] text-rose-600'>{t('Login failed')}</p>
        )}
        <div
          ref={widgetContainer}
          className={
            widgetState === 'ready' && !props.pending ? 'block' : 'hidden'
          }
        />
      </div>
    </Dialog>
  )
}
