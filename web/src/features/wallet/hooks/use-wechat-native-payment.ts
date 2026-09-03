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
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { requestWechatNativePayment, isApiSuccess } from '../api'

export interface WechatNativePaymentResult {
  codeUrl: string
  tradeNo: string
}

/**
 * Hook for the WeChat Native (QR code) payment flow.
 *
 * Unlike hosted-checkout channels, the backend only returns a `code_url`
 * that the caller renders as a QR code; no navigation happens here.
 */
export function useWechatNativePayment() {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<WechatNativePaymentResult | null>(null)

  const processWechatNativePayment = useCallback(
    async (topupAmount: number): Promise<WechatNativePaymentResult | null> => {
      setProcessing(true)
      setResult(null)

      try {
        const response = await requestWechatNativePayment({
          amount: topupAmount,
          payment_method: 'wechat_native',
        })

        if (isApiSuccess(response)) {
          const data = response.data
          if (data && typeof data.code_url === 'string' && data.code_url) {
            const paymentResult = {
              codeUrl: data.code_url,
              tradeNo:
                typeof data.trade_no === 'string' ? data.trade_no : '',
            }
            setResult(paymentResult)
            return paymentResult
          }
        }

        toast.error(response.message || i18next.t('Payment request failed'))
        return null
      } catch {
        toast.error(i18next.t('Payment request failed'))
        return null
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  const reset = useCallback(() => setResult(null), [])

  return { processing, result, processWechatNativePayment, reset }
}
