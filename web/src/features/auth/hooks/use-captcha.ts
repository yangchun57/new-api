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
import i18next from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getCaptcha } from '@/features/auth/api'
import { useStatus } from '@/hooks/use-status'

/**
 * Hook for managing the image captcha challenge on login
 */
export function useCaptcha() {
  const { status } = useStatus()
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false)

  const isCaptchaEnabled = Boolean(
    status?.captcha_enabled ?? status?.data?.captcha_enabled
  )

  const refreshCaptcha = useCallback(async () => {
    if (!isCaptchaEnabled) return
    setIsCaptchaLoading(true)
    try {
      const data = await getCaptcha()
      if (data) {
        setCaptchaId(data.captcha_id)
        setCaptchaImage(data.captcha_image)
      }
    } finally {
      setIsCaptchaLoading(false)
    }
  }, [isCaptchaEnabled])

  useEffect(() => {
    if (isCaptchaEnabled) {
      void refreshCaptcha()
    } else {
      setCaptchaId('')
      setCaptchaImage('')
    }
  }, [isCaptchaEnabled, refreshCaptcha])

  const validateCaptcha = (code: string): boolean => {
    if (isCaptchaEnabled && !code.trim()) {
      toast.info(i18next.t('Please enter the captcha'))
      return false
    }
    return true
  }

  return {
    isCaptchaEnabled,
    captchaId,
    captchaImage,
    isCaptchaLoading,
    refreshCaptcha,
    validateCaptcha,
  }
}
